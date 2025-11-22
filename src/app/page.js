"use client";

import { useEffect, useMemo, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from './providers';
import { api } from '@/lib/http';

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? 'rzp_live_RJ1EJE3OdqE2Bd';

const categories = [
  'Fashion',
  'Electronics',
  'Grocery',
  'Coaching',
  'Restaurant',
  'Real Estate',
  'Portfolio',
  'Healthcare',
  'Education',
  'Beauty & Spa',
  'Travel & Tourism',
  'Fitness',
  'Consulting',
  'Photography',
  'Interior Design'
];

const plans = [
  {
    price: 4999,
    name: 'Starter Website',
    icon: Sparkles,
    popular: false,
    features: ['3-5 Pages', 'Basic SEO', 'Limited Customization', 'Email Support', '7 Days Delivery', '2 Revisions'],
    color: 'blue'
  },
  {
    price: 9999,
    name: 'Premium Website',
    icon: Shield,
    popular: true,
    features: ['5-10 Pages', 'Advanced SEO', 'Moderate Customization', 'Email + Chat Support', '5 Days Delivery', '5 Revisions'],
    color: 'purple'
  },
  {
    price: 14999,
    name: 'Advanced',
    icon: Shield,
    popular: false,
    features: ['10-15 Pages', 'Premium SEO', 'High Customization', 'Priority Support', '3 Days Delivery', '10 Revisions'],
    color: 'orange'
  },
  {
    price: 24999,
    name: 'Pro',
    icon: Shield,
    popular: false,
    features: ['Unlimited Pages', 'Premium+ SEO', 'Complete Customization', '24/7 Dedicated Support', '1-2 Days Delivery', 'Unlimited Revisions'],
    color: 'green'
  }
];

const planComparison = [
  { feature: 'Pages', starter: '3-5', premium: '5-10', advanced: '10-15', pro: 'Unlimited' },
  { feature: 'SEO Optimization', starter: 'Basic', premium: 'Advanced', advanced: 'Premium', pro: 'Premium+' },
  { feature: 'Customization', starter: 'Limited', premium: 'Moderate', advanced: 'High', pro: 'Complete' },
  { feature: 'Support', starter: 'Email', premium: 'Email + Chat', advanced: 'Priority', pro: '24/7 Dedicated' },
  { feature: 'Delivery Time', starter: '7 days', premium: '5 days', advanced: '3 days', pro: '1-2 days' },
  { feature: 'Revisions', starter: '2', premium: '5', advanced: '10', pro: 'Unlimited' }
];

const planColorClasses = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600' }
};

export default function LandingPage() {
  const router = useRouter();
  const { user, setSession } = useAuth();
  const [step, setStep] = useState(1);
  const [showComparison, setShowComparison] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    website_name: '',
    category: '',
    plan: '',
    plan_price: 0
  });

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
      router.replace('/admin');
    } else {
      router.replace('/dashboard');
    }
  }, [router, user]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.phone || !formData.password || !formData.confirmPassword) {
        toast.error('Please fill all fields');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
      if (formData.phone.length < 10) {
        toast.error('Please enter a valid phone number');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.website_name || !formData.category) {
        toast.error('Please fill all fields');
        return false;
      }
    }
    if (step === 3) {
      if (!formData.plan) {
        toast.error('Please select a plan');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const selectedPlan = useMemo(() => plans.find((plan) => plan.name === formData.plan), [formData.plan]);

  const handlePayment = async () => {
    if (!validateStep()) return;

    if (!window.Razorpay) {
      toast.error('Payment gateway is still loading. Please try again in a moment.');
      return;
    }

    setLoading(true);

    try {
      const orderRes = await api.post('/razorpay/create-order', { amount: 900 });
      const { order_id: orderId, amount, currency } = orderRes.data;

      const options = {
        key: RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'Website Builder',
        description: 'Advance Booking Payment',
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/razorpay/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_data: {
                name: formData.name,
                phone: formData.phone,
                password: formData.password,
                website_name: formData.website_name,
                category: formData.category,
                plan: formData.plan,
                plan_price: formData.plan_price
              }
            });

            setSession(verifyRes.data.user, verifyRes.data.access_token);

            toast.success('Payment successful! Welcome aboard!');

            if (verifyRes.data.user.role === 'admin') {
              router.replace('/admin');
            } else {
              router.replace('/dashboard');
            }
          } catch (error) {
            toast.error(error?.response?.data?.detail ?? 'Payment verification failed');
          }
        },
        prefill: {
          name: formData.name,
          contact: formData.phone
        },
        theme: {
          color: '#2563eb'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', () => toast.error('Payment failed. Please try again.'));
      razorpay.open();
    } catch (error) {
      toast.error(error?.response?.data?.detail ?? 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-gradient py-8 px-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Trusted by 500+ businesses
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4" data-testid="landing-title">
            Build Your Website
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Professional websites starting at just <span className="text-green-600 font-bold">₹9</span> advance booking.
            <br className="hidden sm:block" />
            No hidden charges. Fast delivery.
          </p>
        </div>

        <div className="flex items-center justify-center mb-8" data-testid="progress-steps">
          {[1, 2, 3].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`step-indicator flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full font-semibold transition-all ${
                    s < step ? 'completed' : s === step ? 'active' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                <p className="text-xs mt-2 text-gray-600 hidden sm:block">
                  {s === 1 ? 'Details' : s === 2 ? 'Website' : 'Plan'}
                </p>
              </div>
              {idx < 2 && <div className={`h-1 w-12 sm:w-20 mx-1 sm:mx-2 transition-all ${s < step ? 'bg-green-500' : 'bg-gray-300'}`} />}
            </div>
          ))}
        </div>

        <Card className="p-6 sm:p-8 max-w-5xl mx-auto rounded-3xl bg-white">
          {step === 1 && (
            <div data-testid="step-1">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Let&apos;s Get Started</h2>
                <p className="text-gray-600 text-sm">Tell us about yourself</p>
              </div>
              <div className="space-y-5">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    data-testid="input-name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="John Doe"
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-semibold">
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="9876543210"
                    type="tel"
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-sm font-semibold">
                    Create Password *
                  </Label>
                  <Input
                    id="password"
                    data-testid="input-password"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="Minimum 6 characters"
                    type="password"
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold">
                    Confirm Password *
                  </Label>
                  <Input
                    id="confirmPassword"
                    data-testid="input-confirm-password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Re-enter your password"
                    type="password"
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-8">
                <Button onClick={handleNext} data-testid="btn-next-step-1" className="bg-blue-600 hover:bg-blue-700 h-11 px-8">
                  Next <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div data-testid="step-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">About Your Website</h2>
                <p className="text-gray-600 text-sm">Help us understand your vision</p>
              </div>
              <div className="space-y-5">
                <div>
                  <Label htmlFor="website_name" className="text-sm font-semibold">
                    Website Name *
                  </Label>
                  <Input
                    id="website_name"
                    data-testid="input-website-name"
                    value={formData.website_name}
                    onChange={(e) => handleChange('website_name', e.target.value)}
                    placeholder="e.g., My Awesome Store"
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-sm font-semibold">
                    Business Category *
                  </Label>
                  <select
                    id="category"
                    data-testid="select-category"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2.5 mt-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-11"
                  >
                    <option value="">Select your business type</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-between mt-8">
                <Button onClick={() => setStep(1)} variant="outline" data-testid="btn-back-step-2" className="h-11 px-6">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </Button>
                <Button onClick={handleNext} data-testid="btn-next-step-2" className="bg-blue-600 hover:bg-blue-700 h-11 px-8">
                  Next <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

                    {step === 3 && (
            <div data-testid="step-3">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Choose Your Perfect Plan</h2>
                <p className="text-gray-600 text-sm">
                  Pick a plan that fits your stage. You can upgrade anytime.
                </p>
              </div>

              {/* minimal, non-boxy plan cards */}
              <RadioGroup
                value={formData.plan}
                onValueChange={(value) => {
                  const plan = plans.find((p) => p.name === value);
                  handleChange('plan', value);
                  handleChange('plan_price', plan?.price ?? 0);
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6">
                  {plans.map((plan) => {
                    const Icon = plan.icon;
                    const isSelected = formData.plan === plan.name;
                    const colors = planColorClasses[plan.color] ?? planColorClasses.blue;

                    return (
                      <button
                        key={plan.name}
                        type="button"
                        onClick={() => {
                          handleChange('plan', plan.name);
                          handleChange('plan_price', plan.price);
                        }}
                        className={[
                          'group relative flex flex-col items-stretch text-left w-full cursor-pointer',
                          'rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 transition-all',
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 shadow-md shadow-blue-100'
                            : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-sm'
                        ].join(' ')}
                        data-testid={`plan-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {plan.popular && (
                          <span className="absolute -top-3 right-4 rounded-full bg-blue-600 text-white text-[10px] font-semibold px-3 py-1 shadow-sm">
                            RECOMMENDED
                          </span>
                        )}

                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${colors.bg}`}>
                              <Icon className={`w-5 h-5 ${colors.text}`} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {plan.name.replace('Website', '')}
                              </p>
                              <p className="text-sm text-gray-700">
                                {plan.features[0]} · {plan.features[1]}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-semibold text-gray-900 leading-tight">
                              ₹{plan.price.toLocaleString()}
                            </p>
                            <p className="text-[11px] text-gray-500">one-time</p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-[11px] text-gray-500">
                            Includes full website setup
                          </p>
                          <RadioGroupItem
                            value={plan.name}
                            id={plan.name}
                            className="ml-2"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </RadioGroup>

              {/* compare button – full details neeche */}
              <Collapsible open={showComparison} onOpenChange={setShowComparison}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mb-5 h-11 text-sm font-medium"
                    data-testid="btn-toggle-comparison"
                  >
                    <span className="mr-2">View full feature comparison</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${showComparison ? 'rotate-180' : ''}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="overflow-x-auto mb-5 border rounded-lg">
                    <table
                      className="w-full text-sm"
                      data-testid="plan-comparison-table"
                    >
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-3 text-left font-semibold">Feature</th>
                          <th className="p-3 text-center font-semibold">Starter</th>
                          <th className="p-3 text-center font-semibold">Premium</th>
                          <th className="p-3 text-center font-semibold">Advanced</th>
                          <th className="p-3 text-center font-semibold">Pro</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {planComparison.map((row) => (
                          <tr
                            key={row.feature}
                            className="border-t hover:bg-gray-50"
                          >
                            <td className="p-3 font-medium text-gray-700">
                              {row.feature}
                            </td>
                            <td className="p-3 text-center text-gray-600">
                              {row.starter}
                            </td>
                            <td className="p-3 text-center text-gray-600">
                              {row.premium}
                            </td>
                            <td className="p-3 text-center text-gray-600">
                              {row.advanced}
                            </td>
                            <td className="p-3 text-center text-gray-600">
                              {row.pro}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* slim trust strip – big-trust but clean */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      Bigbooster Secure Booking
                    </p>
                    <p className="text-xs text-emerald-800">
                      Pay only <span className="font-semibold">₹9</span> now · pay the rest after you approve your live site.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-900/90">
                  <span className="px-2 py-1 rounded-full bg-white border border-emerald-200">
                    500+ websites delivered
                  </span>
                  <span className="hidden sm:inline px-2 py-1 rounded-full bg-white border border-emerald-200">
                    ⭐ 4.9/5 avg rating
                  </span>
                </div>
              </div>

              {/* best-in-class pay button – no flashy AI style, simple & pro */}
              <Button
                onClick={handlePayment}
                disabled={loading || !selectedPlan}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="btn-pay-advance"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing payment…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    Pay ₹9 &amp; start with {selectedPlan?.name || 'this plan'}
                  </span>
                )}
              </Button>

              <p className="text-center text-xs text-gray-500 mt-3">
                By continuing, you agree to our Terms of Service &amp; Privacy Policy.
              </p>

              <div className="flex justify-start mt-6">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  data-testid="btn-back-step-3"
                  className="h-11 px-6"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </Button>
              </div>
            </div>
          )}

        </Card>

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm sm:text-base">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:underline font-semibold"
              data-testid="link-login"
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

