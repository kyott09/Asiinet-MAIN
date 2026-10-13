function NetworkDiagram() {
  return (
    <svg
      className="network-diagram"
      viewBox="0 0 540 300"
      role="img"
      aria-labelledby="network-title network-description"
    >
      <title id="network-title">Esquema de conexión de Asiinet</title>
      <desc id="network-description">
        Una línea troncal conecta un nodo central con distintos puntos de servicio.
      </desc>
      <path className="network-line network-line-muted" d="M28 150H512M270 25V275M92 55L448 245M92 245L448 55" />
      <path className="network-line network-line-main" d="M28 150H270V62M270 150V238M270 150H454" />
      <circle className="network-node network-node-main" cx="270" cy="150" r="18" />
      <circle className="network-node network-node-point" cx="270" cy="62" r="10" />
      <circle className="network-node network-node-point" cx="270" cy="238" r="10" />
      <circle className="network-node network-node-point" cx="454" cy="150" r="10" />
      <circle className="network-node network-node-point" cx="92" cy="55" r="7" />
      <circle className="network-node network-node-point" cx="92" cy="245" r="7" />
      <circle className="network-node network-node-point" cx="448" cy="55" r="7" />
      <circle className="network-node network-node-point" cx="448" cy="245" r="7" />
      <circle className="network-pulse" cx="28" cy="150" r="5" />
      <text className="network-label" x="270" y="37" textAnchor="middle">NODO</text>
      <text className="network-label" x="480" y="155">CLIENTE</text>
      <text className="network-label" x="270" y="280" textAnchor="middle">RED DE SERVICIO</text>
    </svg>
  );
}

export default NetworkDiagram;
