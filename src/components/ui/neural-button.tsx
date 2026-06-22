"use client";

import * as React from "react";

import type { VariantProps } from "class-variance-authority";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface NeuralButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: VariantProps<typeof buttonVariants>["size"];
  children?: React.ReactNode;
  asChild?: boolean;
}

function NeuralButton({ className, ...props }: NeuralButtonProps) {
  return <Button className={cn("rounded-full", className)} {...props} />;
}

export { NeuralButton, type NeuralButtonProps };
