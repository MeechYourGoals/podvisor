import { Check, X } from 'lucide-react';

const features = [
  { name: 'YouTube Analysis', free: '4/month (weekly)', pro: 'Unlimited', annual: 'Unlimited' },
  { name: 'Audio File Upload', free: '2/month', pro: 'Unlimited', annual: 'Unlimited' },
  { name: 'Context Profiles', free: '2 profiles', pro: '10 profiles', annual: '10 profiles' },
  { name: 'Folders per Profile', free: '2 folders', pro: 'Unlimited', annual: 'Unlimited' },
  { name: 'Personalized Insights', free: true, pro: true, annual: true },
  { name: 'Global Folders View', free: true, pro: true, annual: true },
  { name: 'Export Options', free: 'JSON only', pro: 'JSON, CSV, Markdown', annual: 'JSON, CSV, Markdown' },
  { name: 'Storage History', free: 'Last 30 days', pro: 'Unlimited', annual: 'Unlimited' },
  { name: 'Refresh Insights', free: false, pro: true, annual: true },
];

const renderCell = (value: string | boolean) => {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-5 w-5 text-primary mx-auto" />
    ) : (
      <X className="h-5 w-5 text-muted-foreground mx-auto opacity-30" />
    );
  }
  return <span className="text-sm text-foreground">{value}</span>;
};

export const PricingSection = () => {
  return (
    <section className="py-16 sm:py-24 border-t border-border">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold">Choose Your Plan</h2>
          <p className="text-lg text-muted-foreground">
            Select the perfect plan for your learning journey
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-4 px-6 text-lg font-semibold">Feature</th>
                <th className="text-center py-4 px-6 text-lg font-semibold">Free</th>
                <th className="text-center py-4 px-6 text-lg font-semibold">Pro</th>
                <th className="text-center py-4 px-6 text-lg font-semibold relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full whitespace-nowrap">
                    Best Value
                  </div>
                  Annual Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr 
                  key={feature.name}
                  className={`border-b border-border transition-colors hover:bg-muted/30 ${
                    index === features.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="py-4 px-6 text-sm font-medium">{feature.name}</td>
                  <td className="py-4 px-6 text-center">{renderCell(feature.free)}</td>
                  <td className="py-4 px-6 text-center">{renderCell(feature.pro)}</td>
                  <td className="py-4 px-6 text-center bg-primary/5">{renderCell(feature.annual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-6">
          {['Free', 'Pro', 'Annual'].map((tier) => (
            <div 
              key={tier}
              className={`border-2 rounded-lg p-6 space-y-4 ${
                tier === 'Pro' ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{tier === 'Annual' ? 'Annual Pro' : tier}</h3>
                {tier === 'Annual' && (
                  <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                    Best Value
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {features.map((feature) => (
                  <div key={feature.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{feature.name}</span>
                    <span className="font-medium">
                      {renderCell(feature[tier.toLowerCase() as keyof typeof feature])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};