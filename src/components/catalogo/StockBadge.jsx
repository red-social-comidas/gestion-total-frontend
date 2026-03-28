export const StockBadge = ({ badge }) => {
  if (!badge) return null
  if (badge === 'sin_stock')
    return <span className="badge badge-red">Sin stock</span>
  if (badge === 'ultimas_unidades')
    return <span className="badge badge-yellow">⚡ Últimas unidades</span>
  return null
}
