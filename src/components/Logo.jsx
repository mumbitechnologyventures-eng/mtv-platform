export default function Logo({ small }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={`flex items-center justify-center rounded-sm bg-clay font-black text-ink-900 ${
          small ? 'h-7 w-7 text-sm' : 'h-9 w-9 text-base'
        }`}
      >
        M
      </span>
      <span className={`font-display font-semibold text-sand-100 ${small ? 'text-sm' : 'text-base'}`}>
        Mumbi Technology Ventures
      </span>
    </span>
  )
}
