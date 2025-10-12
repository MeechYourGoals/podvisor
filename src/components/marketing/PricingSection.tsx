import { Check, X } from 'lucide-react';

const features = [
  { name: 'Video Analysis', free: '10/month', pro: 'Unlimited', team: 'Unlimited' },
  { name: 'Context Profiles', free: '3 profiles', pro: 'Unlimited', team: 'Unlimited' },
  { name: 'Personalized Insights', free: true, pro: true, team: true },
  { name: 'Bookmarks & Folders', free: 'Basic', pro: 'Unlimited', team: 'Unlimited' },
  { name: 'Export Options', free: 'JSON only', pro: 'JSON, CSV, Markdown', team: 'JSON, CSV, Markdown, PDF' },
  { name: 'Video Storage', free: 'Last 30 days', pro: 'Unlimited history', team: 'Unlimited history' },
  { name: 'Refresh Insights', free: false, pro: true, team: true },
  { name: 'Team Collaboration', free: false, pro: false, team: true },
  { name: 'Priority Support', free: false, pro: false, team: true },
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
                <th className="text-center py-4 px-6 text-lg font-semibold relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                  Pro
                </th>
                <th className="text-center py-4 px-6 text-lg font-semibold">Team</th>
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
                  <td className="py-4 px-6 text-center bg-primary/5">{renderCell(feature.pro)}</td>
                  <td className="py-4 px-6 text-center">{renderCell(feature.team)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-6">
          {['Free', 'Pro', 'Team'].map((tier) => (
            <div 
              key={tier}
              className={`border-2 rounded-lg p-6 space-y-4 ${
                tier === 'Pro' ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{tier}</h3>
                {tier === 'Pro' && (
                  <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                    Most Popular
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