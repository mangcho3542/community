import { icons } from "lucide-react";
import { HTMLAttributes } from "react";

interface LucideIconProps extends HTMLAttributes<HTMLOrSVGElement> {
  name: keyof typeof icons;
  size?: number;
  color?: string;
}

export function LucideIcon({ name, size, color, ...rest }: LucideIconProps) {
  const Icon = icons[name];
  return <Icon size={size} color={color} {...rest} />;
}
