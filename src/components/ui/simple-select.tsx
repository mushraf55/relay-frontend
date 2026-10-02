"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Option = string | { value: string; label: string };
type Props = {
  options: Option[];
  value?: string;
  defaultValue?: string;
  name?: string;
  disabled?: boolean;
  "aria-label"?: string;
  onValueChange?: (value: string) => void;
};

export function SimpleSelect({ options, onValueChange, ...props }: Props) {
  return <Select {...props} onValueChange={(value) => { if (value != null) onValueChange?.(String(value)); }}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{options.map(option => { const value = typeof option === "string" ? option : option.value; const label = typeof option === "string" ? option : option.label; return <SelectItem key={value} value={value}>{label}</SelectItem>; })}</SelectContent></Select>;
}
