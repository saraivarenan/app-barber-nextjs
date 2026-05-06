export default function Loading() {
  return (
    <>
      <div className="app-header">
        <h1>Carregando</h1>
        <span className="header-spinner" />
      </div>

      <div className="page-content loading-page">
        <div className="loading-card">
          <span className="loading-spinner" />
          <span>Preparando página...</span>
        </div>
        <div className="loading-skeleton wide" />
        <div className="loading-skeleton" />
        <div className="loading-skeleton short" />
      </div>
    </>
  )
}
