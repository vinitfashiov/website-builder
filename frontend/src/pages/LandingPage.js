import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Card } from '../components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { ChevronDown, Check, ArrowRight, ArrowLeft, Star, Shield, Zap, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const categories = [
  'Fashion', 'Electronics', 'Grocery', 'Coaching', 'Restaurant',
  'Real Estate', 'Portfolio', 'Healthcare', 'Education', 'Beauty & Spa',
  'Travel & Tourism', 'Fitness', 'Consulting', 'Photography', 'Interior Design'
];

const plans = [
  { 
    price: 4999, 
    name: 'Starter Website',
    icon: Star,
    popular: false,
    features: ['3-5 Pages', 'Basic SEO', 'Limited Customization', 'Email Support', '7 Days Delivery', '2 Revisions'],
    color: 'blue'
  },
  { 
    price: 9999, 
    name: 'Premium Website',
    icon: Zap,
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
    icon: Crown,
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
  { feature: 'Revisions', starter: '2', premium: '5', advanced: '10', pro: 'Unlimited' },
];

export default function LandingPage({ setUser }) {
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      setStep(step + 1);
    }
  };

  const handlePayment = async () => {
    if (!validateStep()) return;
    
    setLoading(true);
    try {
      const orderRes = await axios.post(`${API}/razorpay/create-order`, { amount: 900 });
      const { order_id, amount, currency } = orderRes.data;

      const options = {
        key: 'rzp_test_KKalFqBEMmmbnB',
        amount: amount,
        currency: currency,
        name: 'Website Builder',
        description: 'Advance Booking Payment',
        order_id: order_id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(`${API}/razorpay/verify-payment`, {
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

            localStorage.setItem('token', verifyRes.data.access_token);
            localStorage.setItem('user', JSON.stringify(verifyRes.data.user));
            setUser(verifyRes.data.user);
            toast.success('Payment successful! Welcome aboard!');
          } catch (err) {
            toast.error(err.response?.data?.detail || 'Payment verification failed');
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

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error('Payment failed. Please try again.');
      });
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-gradient py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Trusted by 500+ businesses
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4" data-testid="landing-title">
            Build Your Dream Website
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Professional websites starting at just <span className="text-green-600 font-bold">₹99</span> advance booking.
            <br className="hidden sm:block" />
            No hidden charges. Fast delivery. 100% satisfaction guaranteed.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8" data-testid="progress-steps">
          {[1, 2, 3].map((s, idx) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center">
                <div className={`step-indicator flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full font-semibold transition-all ${
                  s < step ? 'completed' : s === step ? 'active' : 'bg-gray-300 text-gray-600'
                }`}>
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                <p className="text-xs mt-2 text-gray-600 hidden sm:block">
                  {s === 1 ? 'Details' : s === 2 ? 'Website' : 'Plan'}
                </p>
              </div>
              {idx < 2 && <div className={`h-1 w-12 sm:w-20 mx-1 sm:mx-2 transition-all ${
                s < step ? 'bg-green-500' : 'bg-gray-300'
              }`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <Card className="p-6 sm:p-8 shadow-xl max-w-4xl mx-auto">
          {/* Step 1: Basic Details */}
          {step === 1 && (
            <div data-testid="step-1">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Let's Get Started</h2>
                <p className="text-gray-600 text-sm">Tell us about yourself</p>
              </div>
              <div className="space-y-5">
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold">Full Name *</Label>
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
                  <Label htmlFor="phone" className="text-sm font-semibold">Phone Number *</Label>
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
                  <Label htmlFor="password" className="text-sm font-semibold">Create Password *</Label>
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
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password *</Label>
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

          {/* Step 2: Website Details */}
          {step === 2 && (
            <div data-testid="step-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">About Your Website</h2>
                <p className="text-gray-600 text-sm">Help us understand your vision</p>
              </div>
              <div className="space-y-5">
                <div>
                  <Label htmlFor="website_name" className="text-sm font-semibold">Website Name *</Label>
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
                  <Label htmlFor="category" className="text-sm font-semibold">Business Category *</Label>
                  <select
                    id="category"
                    data-testid="select-category"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2.5 mt-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-11"
                  >
                    <option value="">Select your business type</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
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

          {/* Step 3: Choose Plan */}
          {step === 3 && (
            <div data-testid="step-3">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Choose Your Perfect Plan</h2>
                <p className="text-gray-600 text-sm">Select a plan that fits your needs. You can upgrade anytime!</p>
              </div>

              <RadioGroup value={formData.plan} onValueChange={(val) => {
                const selectedPlan = plans.find(p => p.name === val);
                handleChange('plan', val);
                handleChange('plan_price', selectedPlan.price);
              }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6">
                  {plans.map(plan => {
                    const Icon = plan.icon;
                    const isSelected = formData.plan === plan.name;
                    return (
                      <div
                        key={plan.name}
                        className={`relative plan-card border-2 rounded-xl p-5 cursor-pointer transition-all ${
                          isSelected ? 'selected border-blue-600 shadow-lg' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                        onClick={() => {
                          handleChange('plan', plan.name);
                          handleChange('plan_price', plan.price);
                        }}
                        data-testid={`plan-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 right-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">
                            MOST POPULAR
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${plan.color}-100`}>
                              <Icon className={`w-5 h-5 text-${plan.color}-600`} />
                            </div>
                            <div>
                              <Label htmlFor={plan.name} className="font-bold text-base cursor-pointer">
                                {plan.name}
                              </Label>
                            </div>
                          </div>
                          <RadioGroupItem value={plan.name} id={plan.name} className="mt-1" />
                        </div>
                        <div className="mb-4">
                          <p className="text-3xl font-bold text-gray-900">
                            ₹{plan.price.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">One-time payment</p>
                        </div>
                        <ul className="space-y-2">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>

              <Collapsible open={showComparison} onOpenChange={setShowComparison}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full mb-6 h-11" data-testid="btn-toggle-comparison">
                    <span className="mr-2">Compare Plans in Detail</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showComparison ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="overflow-x-auto mb-6 border rounded-lg">
                    <table className="w-full text-sm" data-testid="plan-comparison-table">
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
                        {planComparison.map((row, idx) => (
                          <tr key={idx} className="border-t hover:bg-gray-50">
                            <td className="p-3 font-medium text-gray-700">{row.feature}</td>
                            <td className="p-3 text-center text-gray-600">{row.starter}</td>
                            <td className="p-3 text-center text-gray-600">{row.premium}</td>
                            <td className="p-3 text-center text-gray-600">{row.advanced}</td>
                            <td className="p-3 text-center text-gray-600">{row.pro}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Trust Badges */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-800">100% Secure Payment</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-700">
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-600" />
                    SSL Encrypted
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-600" />
                    Money-back guarantee
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-600" />
                    No hidden fees
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-600" />
                    24/7 Support
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={loading || !formData.plan}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-6 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all"
                data-testid="btn-pay-advance"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    Secure Payment: Pay ₹99 & Book Now
                  </span>
                )}
              </Button>

              <p className="text-center text-xs text-gray-500 mt-3">
                By proceeding, you agree to our Terms of Service and Privacy Policy
              </p>

              <div className="flex justify-start mt-6">
                <Button onClick={() => setStep(2)} variant="outline" data-testid="btn-back-step-3" className="h-11 px-6">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm sm:text-base">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline font-semibold" data-testid="link-login">
              Login here
            </a>
          </p>
        </div>
      </div>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </div>
  );
}
