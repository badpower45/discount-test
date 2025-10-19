import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MainLayout } from './MainLayout';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Mail, Lock, User, Phone, UserPlus, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

export function CustomerSignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return false;
    }
    if (formData.password.length < 6) {
      setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            user_type: 'customer'
          }
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('customers')
          .insert([
            {
              id: data.user.id,
              name: formData.fullName,
              email: formData.email,
              phone: formData.phone
            }
          ]);

        if (profileError) {
          console.error('Error creating customer profile:', profileError);
        }

        toast.success('تم إنشاء حسابك بنجاح! مرحباً بك');
        navigate('/');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        setError('فشل التسجيل عبر Google');
      }
    } catch (err) {
      console.error('Google sign-up error:', err);
      setError('فشل التسجيل عبر Google. يرجى المحاولة مرة أخرى');
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-theme(spacing.16))] flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-purple-600/5 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full">
          {/* Logo & Welcome */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-2xl mb-6">
              <UtensilsCrossed className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-extrabold text-foreground mb-3">
              إنشاء حساب جديد
            </h2>
            <p className="text-lg text-muted-foreground">
              انضم إلينا وابدأ في توفير المال على طلباتك المفضلة
            </p>
          </div>

          <Card className="shadow-2xl border-2 border-border/50">
            <CardHeader className="space-y-1 bg-gradient-to-r from-primary/5 to-purple-600/5 border-b">
              <CardTitle className="text-2xl text-center font-bold">
                التسجيل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {error && (
                <Alert variant="destructive" className="border-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-base font-semibold">
                    الاسم الكامل
                  </Label>
                  <div className="relative">
                    <User className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder="أدخل اسمك الكامل"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="pr-12 h-14 text-base border-2 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-semibold">
                    البريد الإلكتروني
                  </Label>
                  <div className="relative">
                    <Mail className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="أدخل بريدك الإلكتروني"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pr-12 h-14 text-base border-2 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-semibold">
                    رقم الهاتف
                  </Label>
                  <div className="relative">
                    <Phone className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      placeholder="أدخل رقم هاتفك"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pr-12 h-14 text-base border-2 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-semibold">
                    كلمة المرور
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="أنشئ كلمة مرور"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pr-12 pl-12 h-14 text-base border-2 rounded-xl"
                    />
                    <button
                      type="button"
                      className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-base font-semibold">
                    تأكيد كلمة المرور
                  </Label>
                  <div className="relative">
                    <Lock className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="أعد إدخال كلمة المرور"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pr-12 pl-12 h-14 text-base border-2 rounded-xl"
                    />
                    <button
                      type="button"
                      className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 text-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white shadow-xl rounded-xl mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>جاري إنشاء الحساب...</span>
                    </div>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 ml-2" />
                      إنشاء حساب
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground font-medium">
                    أو التسجيل باستخدام
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full h-14 text-base border-2 rounded-xl"
                onClick={handleGoogleSignUp}
              >
                <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                التسجيل عبر Google
              </Button>

              <div className="text-center pt-4 border-t-2 border-border">
                <span className="text-base text-muted-foreground">
                  لديك حساب بالفعل؟{' '}
                  <Link
                    to="/customer-login"
                    className="font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    تسجيل الدخول
                  </Link>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
