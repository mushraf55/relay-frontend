import { BrandMark, Icon } from "@/components/icon";
import { demoBots } from "@/lib/demo-data";

export function ProductPreview() {
  return (
    <div className="flex min-h-[410px] overflow-hidden rounded-t-xl border bg-card text-left shadow-2xl shadow-foreground/10 ring-8 ring-muted/70" aria-label="Example of the Relay assistant dashboard">
      <div className="flex w-11 shrink-0 flex-col border-r bg-sidebar p-2 sm:w-32 md:w-44 md:p-4">
        <div className="mb-7 flex items-center justify-center gap-2 text-base font-bold text-sidebar-primary md:justify-start">
          <BrandMark />
          <span className="hidden md:inline">Relay</span>
        </div>
        <span className="mb-3 hidden px-2 text-[8px] font-semibold tracking-widest text-muted-foreground md:block">WORKSPACE</span>
        {(["grid", "chat", "inbox", "book", "chart"] as const).map((icon, i) => (
          <div className={`mb-1 flex items-center justify-center gap-2 rounded-md px-2 py-2 text-[10px] md:justify-start ${i === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`} key={icon}>
            <Icon name={icon} size={14}/>
            <span className="hidden md:inline">{["Overview", "Assistants", "My rooms", "Library", "Analytics"][i]}</span>
          </div>
        ))}
        <div className="mt-auto hidden items-center gap-2 text-[10px] text-muted-foreground md:flex"><span className="grid size-7 place-items-center rounded-full bg-muted text-[9px] font-semibold text-foreground">JD</span> My workspace</div>
      </div>
      <div className="min-w-0 flex-1 p-3 sm:p-5">
        <div className="flex items-center justify-between gap-3"><strong className="text-xl font-semibold tracking-tight">Assistants</strong><span className="rounded-md bg-primary px-3 py-2 text-[8px] font-semibold text-primary-foreground">+ Create assistant</span></div>
        <div className="mt-4 flex gap-6 border-b text-[9px] text-muted-foreground"><span className="border-b-2 border-primary pb-3 text-primary">All assistants <b className="rounded bg-secondary px-1 font-medium">6</b></span><span className="pb-3">Active</span><span className="pb-3">Drafts</span></div>
        <div className="flex items-center justify-between gap-3 py-4"><strong className="text-xs font-semibold">Your assistants</strong><span className="hidden w-36 items-center gap-2 rounded border px-3 py-2 text-[8px] text-muted-foreground sm:flex"><Icon name="search" size={12}/> Search assistants</span></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{demoBots.slice(0, 4).map(bot => <div className="rounded-lg border p-3" key={bot.id}><div className="mb-3 flex items-center justify-between"><span className="grid size-8 place-items-center rounded-lg bg-secondary text-primary"><Icon name={bot.icon}/></span><span className="rounded bg-secondary px-2 py-1 text-[7px] font-medium text-secondary-foreground">● {bot.status}</span></div><strong className="block text-xs font-semibold">{bot.name}</strong><p className="mt-1 min-h-8 text-[8px] leading-relaxed text-muted-foreground">{bot.description}</p><div className="mt-3 flex gap-4 border-t pt-2 text-[7px] text-muted-foreground"><span>Sources <b className="text-foreground">{bot.sources}</b></span><span>Rooms <b className="text-foreground">{bot.conversations.toLocaleString("en-US")}</b></span></div><div className="mt-3 flex gap-2 text-center text-[7px]"><span className="flex-1 rounded bg-secondary px-2 py-2 text-primary">Ask</span><span className="flex-1 rounded border px-2 py-2">Manage ↗</span></div></div>)}</div>
        <div className="flex items-center gap-2 pt-4 text-[8px] text-muted-foreground"><span className="size-1.5 rounded-full bg-primary"/> Everything in one workspace <span className="ml-auto">Sample data</span></div>
      </div>
    </div>
  );
}
