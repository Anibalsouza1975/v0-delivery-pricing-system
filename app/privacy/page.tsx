export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Política de Privacidade - Cartago Burguer Grill</h1>

        <div className="space-y-6 text-foreground/80">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Informações Coletadas</h2>
            <p>
              Coletamos apenas as informações necessárias para processar pedidos via WhatsApp, incluindo nome, número de
              telefone e endereço de entrega.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Uso das Informações</h2>
            <p>As informações são utilizadas exclusivamente para:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Processar e entregar pedidos</li>
              <li>Comunicação sobre o status do pedido</li>
              <li>Atendimento ao cliente via WhatsApp</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Compartilhamento de Dados</h2>
            <p>
              Não compartilhamos suas informações pessoais com terceiros, exceto quando necessário para entrega dos
              pedidos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Segurança</h2>
            <p>Implementamos medidas de segurança adequadas para proteger suas informações pessoais.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Contato</h2>
            <p>Para questões sobre esta política, entre em contato via WhatsApp: +1 555 185 0889</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Atualizações</h2>
            <p>
              Esta política pode ser atualizada periodicamente. A versão mais recente estará sempre disponível nesta
              página.
            </p>
          </section>

          <p className="text-sm text-foreground/60 mt-8">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
    </div>
  )
}
