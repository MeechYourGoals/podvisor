import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!webhookSecret) {
      throw new Error('Webhook secret not configured')
    }

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )

    console.log('Webhook event:', event.type)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const tier = session.metadata?.tier

        if (!userId || !tier) {
          console.error('Missing metadata in checkout session')
          break
        }

        // Update subscription
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            tier: tier,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            profile_limit: tier === 'pro' ? 15 : tier === 'team' ? 15 : 3,
            videos_per_month: tier === 'free' ? 10 : 999999,
          })
          .eq('user_id', userId)

        console.log('Subscription updated for user:', userId, 'to tier:', tier)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get user by customer ID
        const { data: userSub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!userSub) {
          console.error('User not found for customer:', customerId)
          break
        }

        // Determine tier from subscription items
        const tierMap: Record<string, string> = {
          // You'll need to populate this with your actual price IDs
        }

        const priceId = subscription.items.data[0]?.price.id
        const tier = tierMap[priceId] || 'free'

        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            tier: tier,
            stripe_subscription_id: subscription.id,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('user_id', userSub.user_id)

        console.log('Subscription updated for user:', userSub.user_id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: userSub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!userSub) {
          console.error('User not found for customer:', customerId)
          break
        }

        // Downgrade to free tier
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            tier: 'free',
            stripe_subscription_id: null,
            profile_limit: 3,
            videos_per_month: 10,
          })
          .eq('user_id', userSub.user_id)

        console.log('Subscription cancelled for user:', userSub.user_id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment failed for customer:', invoice.customer)
        // TODO: Send notification email
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})