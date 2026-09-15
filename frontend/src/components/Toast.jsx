export default function Toast({ toast }) {
  return (
    <div className={`toast ${toast.type} ${toast.show ? 'show' : ''}`}>
      {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
    </div>
  )
}
