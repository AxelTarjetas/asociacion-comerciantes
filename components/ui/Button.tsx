import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
  href?: string;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

export function Button({
  children,
  className,
  href,
  variant = "primary",
  ...props
}: ButtonProps) {
  const buttonClassName = cn("button", `button-${variant}`, className);

  if (href) {
    return (
      <Link className={buttonClassName} href={href} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={buttonClassName} type="button" {...props}>
      {children}
    </button>
  );
}
