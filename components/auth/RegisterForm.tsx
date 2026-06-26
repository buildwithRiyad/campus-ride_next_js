'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/schemas';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RegisterForm() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setIsLoading(true);

      // ✅ Exclude confirmPassword – it's only for frontend validation
      const { confirmPassword, ...submitData } = data;

      const response = await authAPI.register(submitData); // confirmPassword not sent

      setUser(response.user);
      setToken(response.token);

      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      toast.success('Registration successful!');
      router.push('/');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Registration failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Sign Up</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Full Name */}
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input
                {...form.register('name')}
                type="text"
                placeholder="John Doe"
                className="mt-1"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Student ID */}
            <div>
              <label className="text-sm font-medium">Student ID</label>
              <Input
                {...form.register('studentId')}
                type="text"
                placeholder="221-15-1234"
                className="mt-1"
              />
              {form.formState.errors.studentId && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.studentId.message}
                </p>
              )}
            </div>

            {/* Department (Optional) */}
            <div>
              <label className="text-sm font-medium">
                Department (Optional)
              </label>
              <Input
                {...form.register('department')}
                type="text"
                placeholder="CSE"
                className="mt-1"
              />
              {form.formState.errors.department && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.department.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                {...form.register('email')}
                type="email"
                placeholder="you@example.com"
                className="mt-1"
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="text-sm font-medium">
                Phone (Optional)
              </label>
              <Input
                {...form.register('phone')}
                type="tel"
                placeholder="017xxxxxxxx"
                className="mt-1"
              />
              {form.formState.errors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                {...form.register('password')}
                type="password"
                placeholder="••••••••"
                className="mt-1"
              />
              {form.formState.errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                {...form.register('confirmPassword')}
                type="password"
                placeholder="••••••••"
                className="mt-1"
              />
              {form.formState.errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading
                ? 'Creating account...'
                : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary hover:underline font-semibold"
            >
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}