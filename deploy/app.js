// Sistema Cartago - Versão Estática
class CartagoSystem {
  constructor() {
    this.init()
  }

  init() {
    // Remover loading
    setTimeout(() => {
      document.querySelector(".loading").style.display = "none"
      this.renderSystem()
    }, 2000)
  }

  renderSystem() {
    const root = document.getElementById("root")
    root.innerHTML = `
            <div class="sistema-container">
                <div class="header">
                    <h1>🍔 Cartago Burger Grill - Sistema de Gestão</h1>
                    <p>Sistema integrado de precificação, vendas e auto atendimento</p>
                </div>
                
                <div class="modules-grid">
                    <div class="module-card">
                        <h3>📊 Dashboard Executivo</h3>
                        <p>Visão geral das vendas e métricas</p>
                        <button class="btn" onclick="sistema.openModule('dashboard')">Abrir</button>
                    </div>
                    
                    <div class="module-card">
                        <h3>🥩 Cadastro de Insumos</h3>
                        <p>Gerenciar ingredientes e custos</p>
                        <button class="btn" onclick="sistema.openModule('insumos')">Abrir</button>
                    </div>
                    
                    <div class="module-card">
                        <h3>📋 Ficha Técnica</h3>
                        <p>Receitas e composição dos produtos</p>
                        <button class="btn" onclick="sistema.openModule('ficha')">Abrir</button>
                    </div>
                    
                    <div class="module-card">
                        <h3>💰 Precificação Automática</h3>
                        <p>Cálculo automático de preços</p>
                        <button class="btn" onclick="sistema.openModule('precificacao')">Abrir</button>
                    </div>
                    
                    <div class="module-card">
                        <h3>🤖 Auto Atendimento WhatsApp</h3>
                        <p>IA para atendimento automatizado</p>
                        <button class="btn" onclick="sistema.openModule('whatsapp')">Abrir</button>
                    </div>
                    
                    <div class="module-card">
                        <h3>🛒 Vendas</h3>
                        <p>Gerenciar pedidos e vendas</p>
                        <button class="btn" onclick="sistema.openModule('vendas')">Abrir</button>
                    </div>
                </div>
            </div>
        `
  }

  openModule(module) {
    alert(`Módulo ${module} será implementado na versão completa!`)
  }
}

// Inicializar sistema
const sistema = new CartagoSystem()
