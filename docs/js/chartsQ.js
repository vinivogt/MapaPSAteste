// js. que controla o painel de gráficos, ele é dependente do calculo do stats.js e dos dados manuais
// Para novos gráficos seguir o mesmo padrão de codigo
/////////////////////////////////////////////////////////////////////////////////////////////////////


// Função de criação do painel de gráficos
(function(){
  'use strict';

  const ID_BTN   = 'chart-btn';
  const ID_PANEL = 'painelchart';
  const ID_CLOSE = 'close-painelchart';

  function $(id){ return document.getElementById(id); }
  function isHidden(el){ return el.classList.contains('hidden'); }
  
  function contarAcumulado(datas) {
    const contagem = {};
    
    datas.forEach(d => {
        const partes = d.split("/"); 
        const chave = `${partes[2]}-${partes[1]}`;
        contagem[chave] = (contagem[chave] || 0) + 1;
    });

    
    const ordenadas = Object.keys(contagem).sort();

    let soma = 0;
    const labels = [];
    const valores = [];

    ordenadas.forEach(chave => {
        soma += contagem[chave];
        const partes = chave.split("-");
        labels.push(`${partes[1]}/${partes[0]}`);
        valores.push(soma);
    });

    return { labels, valores };
}

  function createPanelController(btn, panel, closeBtn){
    let restoreFocusTo = null;
    let chartInstance = null;
    let currentChartType = "comparacao";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Aqui sera preciso atualizar com a nova data de adesão da propriedades aderida/////
// Linha do tempo das adesões
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    const datasAdesao = [
      "29/08/2022","29/08/2022","29/08/2022","19/05/2023","24/11/2023",
      "06/03/2024","28/05/2024","24/09/2024","24/09/2024","07/10/2024",
      "04/11/2024","20/12/2024","20/12/2024","20/12/2024","20/12/2024",
      "20/12/2024","20/12/2024","22/04/2025","22/04/2025","22/04/2025",
      "24/04/2025","24/04/2025","21/07/2025","25/07/2025","30/07/2025"
    ];
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Função especifica para o gráfico de comparação 
    function desenharComparacao(ctx){
      const total = Number(window.totalAreaSum) || 0;
      const green = Number(window.totalGreenSum) || 0;
      const contratadaEl = Array.from(document.querySelectorAll('.stats-item')).find(item =>
        item.querySelector('.stats-label')?.textContent.includes('Área contratada')
      )?.querySelector('.stats-value');
      let contracted = 0;
      if (contratadaEl) {
        contracted = parseFloat(
          contratadaEl.textContent.replace(/\./g, '').replace(',', '.')
        ) || 0;
      }

      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Propriedade'],
          datasets: [
            { label:'Área Total', data:[total], backgroundColor:'rgba(15,92,143,0.6)' },
            { label:'Área Verde total', data:[green], backgroundColor:'rgba(104,218,82,0.6)' },
            { label:'Área Contratada', data:[contracted], backgroundColor:'rgba(252,186,121,0.6)' }
          ]
        },
        options: {
          responsive:true,
          plugins: {
            legend:{position:'bottom'},
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = Number(context.raw) || 0;
                  const pct = total ? ((value / total) * 100).toFixed(1) + '%' : '0.0%';
                  return `${context.dataset.label}: ${value} ha (${pct} da Área Total)`;
                }
              }
            }
          },
          scales: {
            x:{stacked:false},
            y:{beginAtZero:true,title:{display:true,text:'ha'}}
          }
        }
      });
    }

//////////////////////////////////////////////////////////////////////////////////////////////////
// Função de criação da linha do tempo das adesões
//////////////////////////////////////////////////////////////////////////////////////////////////

    function desenharLinhaTempo(ctx){
      const {labels, valores} = contarAcumulado(datasAdesao);
      return new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets:[{
            label:'Adesões acumuladas',
            data: valores,
            borderColor:'rgb(15,92,143)',
            backgroundColor:'rgba(15,92,143,0.3)',
            tension:0.2
          }]
        },
        options:{
          responsive:true,
          plugins:{legend:{position:'bottom'}},
          scales:{y:{beginAtZero:true}}
        }
      });
    }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////    
// Será preciso atualizar essa parte para o gráfico de pagamentos por ano do programa adicionando a data e o valor do pagamento seguindo o mesmo padrão
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
    const pagamentosRaw = [
      {date:'04/10/2023', amount:'R$ 1.877,31'},
      {date:'02/10/2023', amount:'R$ 571,63'},
      {date:'02/10/2023', amount:'R$ 2.276,99'},
      {date:'24/09/2024', amount:'R$ 1.821,42'},
      {date:'24/09/2024', amount:'R$ 790,58'},
      {date:'24/09/2024', amount:'R$ 3.265,17'},
      {date:'13/06/2024', amount:'R$ 6.531,23'},
      {date:'12/12/2024', amount:'R$ 1.773,35'},
      {date:'15/05/2025', amount:'R$ 7.815,93'},
      {date:'18/03/2025', amount:'R$ 549,19'},
      {date:'26/05/2025', amount:'R$ 5.469,10'},
      {date:'11/09/2025', amount:'R$ 1.427,81'},
      {date:'11/09/2025', amount:'R$ 10.361,25'},
      {date:'11/09/2025', amount:'R$ 589,88'}
    ];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function parseBRNumber(s){
      if (!s && s !== 0) return 0;
      return parseFloat(String(s).replace(/[R$\s\.]/g,'').replace(',','.')) || 0;
    }
    function parseBRDate(d){
      const p = String(d).trim().split('/');
      return new Date(+p[2], +p[1]-1, +p[0]);
    }
    
// Função de criação do gráfico de pagamentos p/ano
    function agruparPagamentosPorAno(){
      const mapa = {};
      pagamentosRaw.forEach(r => {
        const dt = parseBRDate(r.date);
        const ano = String(dt.getFullYear());
        mapa[ano] = (mapa[ano] || 0) + parseBRNumber(r.amount);
      });
      const anos = Object.keys(mapa).sort((a,b)=> +a - +b);
      return {
        labels: anos,
        valores: anos.map(a => +mapa[a].toFixed(2))
      };
    }
    
    function desenharPagamentos(ctx){
      const {labels, valores} = agruparPagamentosPorAno();
      return new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets:[{
            label: 'Pagamentos por ano (R$)',
            data: valores,
            borderColor: 'rgb(15,92,143)',
            backgroundColor: 'rgba(15,92,143,0.15)',
            tension: 0.25,
            pointRadius: 6,
            pointHoverRadius: 8,
            fill: true
          }]
        },
        options:{
          responsive:true,
          plugins:{
            legend:{position:'bottom'},
            tooltip:{
              callbacks:{
                label: function(ctx){
                  const v = Number(ctx.parsed.y || 0);
                  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
                }
              }
            }
          },
          scales:{
            y:{
              beginAtZero:true,
              ticks:{
                callback: function(value){
                  return Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
                }
              },
              title:{display:true,text:'R$'}
            },
            x:{
              title:{display:true,text:'Ano'}
            }
          }
        }
      });
    }
//////////////////////////////////////////////////////////////////////////////////////////////////////////

// Funções gerais do graficos e da escolha
    function abrir(){
      restoreFocusTo = document.activeElement;
      panel.classList.remove('hidden');
      panel.setAttribute('aria-hidden','false');
      panel.setAttribute('aria-modal','true');

      renderizarGrafico();

      (panel.querySelector('button, [tabindex], input, select, textarea, a') || panel).focus();
      document.addEventListener('keydown', onKeyDown);
    }

    function renderizarGrafico(){
      const canvas = document.getElementById('myChart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (chartInstance) chartInstance.destroy();

      if (currentChartType === "comparacao"){
        chartInstance = desenharComparacao(ctx);
      } else if (currentChartType === "linha"){
        chartInstance = desenharLinhaTempo(ctx);
      } else if (currentChartType === "pagamentos"){
        chartInstance = desenharPagamentos(ctx);
      }
    }

    function fechar(){
      panel.classList.add('hidden');
      panel.setAttribute('aria-hidden','true');
      panel.removeAttribute('aria-modal');
      document.removeEventListener('keydown', onKeyDown);
      if (restoreFocusTo) restoreFocusTo.focus();
    }

    function toggle(){
      isHidden(panel) ? abrir() : fechar();
    }

    function onKeyDown(e){
      if (e.key === 'Escape') fechar();
    }

    if (btn) btn.addEventListener('click', toggle);
    if (closeBtn) closeBtn.addEventListener('click', fechar);

    const chartSelect = document.getElementById('chartSelect');

    chartSelect.addEventListener('change', () => {
        currentChartType = chartSelect.value;
        renderizarGrafico();
    });
  }
  function init(){
    const btn = $(ID_BTN);
    const panel = $(ID_PANEL);
    const closeBtn = $(ID_CLOSE);
    if (!btn || !panel) return;
    createPanelController(btn, panel, closeBtn);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
