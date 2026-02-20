import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  loadPaymentsLocal,
  savePaymentLocal,
  deletePaymentLocal,
  type TripPayment,
} from "@/lib/paymentStorage";
import { Plus, Receipt, Loader2, Trash2 } from "lucide-react";

const CURRENCIES = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "BTC", label: "BTC (Bitcoin)" },
  { value: "ETH", label: "ETH (Ethereum)" },
  { value: "JPY", label: "JPY" },
  { value: "CAD", label: "CAD" },
  { value: "AUD", label: "AUD" },
];

interface BudgetTabProps {
  tripId: string;
  currentUserId?: string;
  currentUserName?: string;
}

export function BudgetTab({
  tripId,
  currentUserId,
  currentUserName = "You",
}: BudgetTabProps) {
  const [payments, setPayments] = useState<TripPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("trip_payments")
          .select("*")
          .eq("trip_id", tripId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setPayments(
          (data || []).map((p) => ({
            ...p,
            amount: typeof p.amount === "string" ? parseFloat(p.amount) : p.amount,
            created_at: p.created_at ?? new Date().toISOString(),
            updated_at: p.updated_at ?? new Date().toISOString(),
          }))
        );
      } else {
        const local = await loadPaymentsLocal(tripId);
        setPayments(local);
      }
    } catch (error) {
      console.error("Failed to load payments:", error);
      toast({
        title: "Failed to load payments",
        description: "Try refreshing the page",
        variant: "destructive",
      });
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [tripId, toast]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleAddPayment = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a positive number",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();
      const newPayment: TripPayment = {
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: user?.id ?? null,
        amount: amt,
        currency,
        description: description.trim() || null,
        payer_name: currentUserName || null,
        created_at: now,
        updated_at: now,
      };

      if (user) {
        const { error } = await supabase.from("trip_payments").insert({
          id: newPayment.id,
          trip_id: tripId,
          user_id: user.id,
          amount: amt,
          currency,
          description: description.trim() || null,
          payer_name: currentUserName || null,
        });

        if (error) throw error;
      }

      await savePaymentLocal(newPayment);
      setPayments((prev) => [...prev, newPayment].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));

      setAmount("");
      setDescription("");
      setAddDialogOpen(false);
      toast({
        title: "Payment saved",
        description: `${amt} ${currency} added to trip budget`,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to save payment";
      console.error("Failed to save payment:", error);
      toast({
        title: "Failed to save payment",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("trip_payments")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);
      }

      await deletePaymentLocal(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Payment removed" });
    } catch (error) {
      console.error("Failed to delete payment:", error);
      toast({
        title: "Failed to remove payment",
        variant: "destructive",
      });
    }
  };

  const formatAmount = (p: TripPayment) => {
    const amt = typeof p.amount === "number" ? p.amount : parseFloat(String(p.amount));
    if (["BTC", "ETH"].includes(p.currency)) {
      return `${amt.toFixed(8)} ${p.currency}`;
    }
    return `${amt.toLocaleString()} ${p.currency}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Trip Budget</h3>
        <Button
          size="sm"
          onClick={() => setAddDialogOpen(true)}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </div>

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center text-muted-foreground py-12">
          <Receipt className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm">No payments yet</p>
          <p className="text-xs mt-1">Add expenses to track your trip budget</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add first payment
          </Button>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{formatAmount(p)}</p>
                {p.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {p.description}
                  </p>
                )}
                {p.payer_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.payer_name}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(p.id)}
                aria-label="Remove payment"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="e.g. Dinner, hotel, activity"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPayment} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
