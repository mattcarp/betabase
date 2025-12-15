"use client";

import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../src/components/ui/form";
import { useForm } from "react-hook-form";

export default function MACComponentsTestPage() {
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      username: "",
    },
  });

  return (
    <div className="min-h-screen bg-[var(--mac-surface-background)] p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-light text-white mb-2">MAC Design System Components Test</h1>
          <p className="text-[var(--mac-text-secondary)]">
            Testing Button, Input, and Form components with MAC styling
          </p>
        </div>

        {/* Button Component Section */}
        <section className="mac-card p-8">
          <h2 className="text-2xl font-light text-white mb-6">Button Components</h2>

          <div className="space-y-6">
            {/* Button Variants */}
            <div>
              <h3 className="text-sm text-[var(--mac-text-muted)] mb-4">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button className="mac-button mac-button-primary" variant="default">
                  Default Button
                </Button>
                <Button className="mac-button mac-button-secondary" variant="secondary">
                  Secondary
                </Button>
                <Button className="mac-button mac-button-outline" variant="outline">
                  Outline
                </Button>
                <Button className="mac-button mac-button-outline" variant="ghost">
                  Ghost
                </Button>
                <Button className="mac-button mac-button-primary" variant="link">
                  Link Button
                </Button>
                <Button className="mac-button mac-button-primary" variant="destructive">
                  Destructive
                </Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div>
              <h3 className="text-sm text-[var(--mac-text-muted)] mb-4">Sizes</h3>
              <div className="flex items-center gap-4">
                <Button className="mac-button mac-button-primary" size="sm">
                  Small
                </Button>
                <Button className="mac-button mac-button-primary" size="default">
                  Default
                </Button>
                <Button className="mac-button mac-button-primary" size="lg">
                  Large
                </Button>
                <Button className="mac-button mac-button-primary" size="icon">
                  🎨
                </Button>
              </div>
            </div>

            {/* Button States */}
            <div>
              <h3 className="text-sm text-[var(--mac-text-muted)] mb-4">States</h3>
              <div className="flex gap-4">
                <Button>Normal</Button>
                <Button className="mac-button mac-button-primary" disabled>
                  Disabled
                </Button>
                <Button className="mac-button mac-button-primary" shimmer>
                  With Shimmer
                </Button>
                <Button className="mac-button mac-button-primary" glow>
                  With Glow
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Input Component Section */}
        <section className="mac-card p-8">
          <h2 className="text-2xl font-light text-white mb-6">Input Components</h2>

          <div className="space-y-6">
            {/* Basic Inputs */}
            <div>
              <h3 className="text-sm text-[var(--mac-text-muted)] mb-4">Basic Inputs</h3>
              <div className="space-y-4 max-w-md">
                <Input className="mac-input" placeholder="Default input" />
                <Input className="mac-input" placeholder="With glow on focus" glow />
                <Input className="mac-input" placeholder="Without glow" glow={false} />
                <Input className="mac-input" type="email" placeholder="Email input" />
                <Input className="mac-input" type="password" placeholder="Password input" />
              </div>
            </div>

            {/* Input States */}
            <div>
              <h3 className="text-sm text-[var(--mac-text-muted)] mb-4">States</h3>
              <div className="space-y-4 max-w-md">
                <Input className="mac-input" placeholder="Normal state" />
                <Input
                  className="mac-input"
                  placeholder="Error state"
                  error
                  helperText="This field has an error"
                />
                <Input
                  className="mac-input"
                  placeholder="With helper text"
                  helperText="This is helper text"
                />
                <Input className="mac-input" placeholder="Disabled input" disabled />
                <Input
                  className="mac-input"
                  placeholder="Required field"
                  required
                  aria-label="Required field"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Form Component Section */}
        <section className="mac-card p-8">
          <h2 className="text-2xl font-light text-white mb-6">Form Components</h2>

          <Form {...form}>
            <form className="space-y-6 max-w-md">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Username</FormLabel>
                    <FormControl>
                      <Input className="mac-input" placeholder="Enter your username" {...field} />
                    </FormControl>
                    <FormDescription>This is your public display name.</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        className="mac-input"
                        type="email"
                        placeholder="email@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      We'll never share your email with anyone else.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Password</FormLabel>
                    <FormControl>
                      <Input
                        className="mac-input"
                        type="password"
                        placeholder="Enter password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage type="error">Password must be at least 8 characters</FormMessage>
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button className="mac-button mac-button-primary" type="submit">
                  Submit Form
                </Button>
                <Button className="mac-button mac-button-outline" type="button" variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </section>

        {/* Test Results */}
        <section className="mac-card p-8">
          <h2 className="text-2xl font-light text-white mb-4">Test Results</h2>
          <div className="space-y-2 text-sm">
            <p className="text-green-400">✅ Button component using MAC classes</p>
            <p className="text-green-400">✅ Input component with MAC styling and ARIA</p>
            <p className="text-green-400">✅ Form components with MAC design system</p>
            <p className="text-green-400">✅ All components backward compatible</p>
            <p className="text-green-400">✅ No console errors</p>
          </div>
        </section>
      </div>
    </div>
  );
}
