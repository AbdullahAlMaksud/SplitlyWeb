import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { BorderBeam } from "@/components/ui/border-beam";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-full border border-transparent text-sm font-medium whitespace-nowrap shadow-sm transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:relative [&_svg]:z-[2] [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-emerald-300/18 bg-emerald-900 text-emerald-50 shadow-[0_10px_28px_rgba(2,44,34,0.34)] hover:-translate-y-0.5 hover:bg-emerald-950 dark:border-emerald-100/14 dark:bg-emerald-800 dark:hover:bg-emerald-700",
        outline:
          "border-emerald-300/16 bg-emerald-950/84 text-emerald-50 shadow-[0_10px_28px_rgba(2,44,34,0.26)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-emerald-950 aria-expanded:bg-emerald-950 dark:border-emerald-100/12 dark:bg-emerald-950/78 dark:hover:bg-emerald-950/90",
        secondary:
          "border-emerald-300/14 bg-emerald-950/72 text-emerald-50 shadow-[0_8px_22px_rgba(2,44,34,0.24)] backdrop-blur-xl hover:-translate-y-0.5 hover:bg-emerald-950/84 aria-expanded:bg-emerald-950/84 dark:border-emerald-100/10 dark:bg-emerald-950/72 dark:hover:bg-emerald-950/88",
        ghost:
          "border border-emerald-900/20 bg-emerald-950/8 text-foreground hover:bg-emerald-950/14 hover:text-foreground aria-expanded:bg-emerald-950/14 aria-expanded:text-foreground dark:border-emerald-100/10 dark:bg-emerald-100/6 dark:hover:bg-emerald-100/10",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-full px-2 text-xs in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-full px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-full has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-full in-data-[slot=button-group]:rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-full in-data-[slot=button-group]:rounded-full",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  children,
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const decoratedVariant =
    variant === "default" || variant === "outline" || variant === "secondary";
  const variantClassName = cn(buttonVariants({ variant, size, className }));
  const neuralBackground = decoratedVariant ? (
    <>
      {/* <span className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-r from-black/18 via-white/5 to-white/14" /> */}
      {/* <span className="pointer-events-none absolute inset-px -z-10 rounded-[inherit] bg-emerald-900/96 dark:bg-emerald-800/88" /> */}
      {/* <svg
        width="98"
        height="40"
        viewBox="0 0 98 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-x-0 bottom-px -z-10 h-12 w-full blur-[6px]"
        aria-hidden="true"
      >
        <g filter="url(#splitly-button-glow)">
          <path
            d="M99 37.5708C60.3329 38.179 38.3917 38.106 -1 37.5708C-1 37.5708 2.65293 34.4541 7.59896 29.7774C12.545 25.1008 81.7895 24.0613 90.3618 30.737C98.9341 37.4128 99 37.5708 99 37.5708Z"
            fill="rgb(209 250 229)"
          />
        </g>
        <defs>
          <filter
            id="splitly-button-glow"
            x="-28.9"
            y="-1.9"
            width="155.8"
            height="67.8"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              stdDeviation="13.95"
              result="effect1_foregroundBlur"
            />
          </filter>
        </defs>
      </svg> */}
    </>
  ) : null;
  const neuralOverlay = decoratedVariant ? (
    <>
      <span className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] [box-shadow:0px_1px_1.6px_0px_color-mix(in_oklab,white_68%,transparent)_inset]" />
      <BorderBeam
        size={36}
        duration={4.2}
        colorFrom="rgb(255 255 255)"
        colorTo="rgb(110 231 183)"
      />
    </>
  ) : null;

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as {
      className?: string;
      children?: React.ReactNode;
    };

    return React.cloneElement(children, {
      ...props,
      "data-slot": "button",
      "data-variant": variant,
      "data-size": size,
      className: cn(variantClassName, childProps.className),
      children: (
        <>
          {neuralBackground}
          {childProps.children}
          {neuralOverlay}
        </>
      ),
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={variantClassName}
      {...props}
    >
      {neuralBackground}
      {children}
      {neuralOverlay}
    </button>
  );
}

export { Button, buttonVariants };
