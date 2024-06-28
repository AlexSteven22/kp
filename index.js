const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fetchDataset = async () => {
  try {
    const response = await fetch("/dataset_23.json");
    const data = await response.json();
    return data;
  } catch (error) {
    alert("Failed to fetch dataset. Please try again later.");
  }
};

const getFilteredData = (dataset, selectedMonths, selectedPizzas) => {
  return dataset.filter(data => {
    const [month] = data.date.split("/");
    const isMonthSelected = selectedMonths.length === 0 || selectedMonths.includes(parseInt(month));
    const isPizzaSelected = selectedPizzas.length === 0 || selectedPizzas.includes(data.pizza_type_id);
    return isMonthSelected && isPizzaSelected;
  });
};

const mappedData = async (filteredData) => {
  const dataMonths = filteredData.map((data) => ({ ...data, date: data.date.split("/") }));
  const reduced = dataMonths.reduce((accumulator, currentVal) => {
    const month = months[parseInt(currentVal.date[0]) - 1]; 
    if (accumulator[month] == null) accumulator[month] = [];
    accumulator[month].push(currentVal);
    return accumulator;
  }, {});

  const mappedReduced = Object.keys(reduced).map((month) =>
    reduced[month].map((data) => parseInt(data.quantity) * parseFloat(data.price))
  );
  return mappedReduced;
};

const mappedBySize = async (filteredData) => {
  const reduce = filteredData.reduce((acc, curr) => {
    const size = curr.size;
    if (acc[size] == null) acc[size] = [];
    acc[size].push(curr);
    return acc;
  }, {});
  const reducedSize = Object.entries(reduce).map((item) => item.filter((data) => typeof data === "object").flat());
  const mappedSize = reducedSize.map((item) => ({ label: item[0].size, value: item.length }));
  return mappedSize;
};

const mappedByCategory = async (filteredData) => {
  const reduce = filteredData.reduce((acc, curr) => {
    const category = curr.category;
    if (acc[category] == null) acc[category] = [];
    acc[category].push(curr);
    return acc;
  }, {});
  const reducedCategory = Object.entries(reduce).map((item) => item.filter((data) => typeof data === "object").flat());
  const mappedCategory = reducedCategory.map((item) => item.length);
  return mappedCategory;
};

const orderByCategory = async (filteredData) => await mappedByCategory(filteredData);
const orderBySize = async (filteredData) => await mappedBySize(filteredData);
const totalRevenueMoM = async (filteredData) => {
  const data = await mappedData(filteredData);
  if (data) return data.map((item) => item.reduce((acc, curr) => acc + curr, 0));
};
const totalOrder = async (filteredData) => {
  const data = await mappedData(filteredData);
  if (data) return data.map((item) => item.length);
};

document.addEventListener('DOMContentLoaded', async function () {
  const dataset = await fetchDataset();
  
  let chart1, chart2, chart3, chart4, chart5;

  const updateCharts = async () => {
    const selectedMonths = Array.from(document.getElementById('month-select').selectedOptions).map(option => parseInt(option.value));
    const selectedPizzas = Array.from(document.getElementById('pizza-select').selectedOptions).map(option => option.value);
    const filteredData = getFilteredData(dataset, selectedMonths, selectedPizzas);


    let revenue = await totalRevenueMoM(filteredData);

    let order = await totalOrder(filteredData);
    let ordsize = await orderBySize(filteredData);
    let ordcategory = await orderByCategory(filteredData);

    if (!revenue || !order || !ordsize || !ordcategory) {
      return;
    }
    if (chart1) chart1.destroy();
    if (chart2) chart2.destroy();
    if (chart3) chart3.destroy();
    if (chart4) chart4.destroy();
    if (chart5) chart5.destroy();

    
    document.getElementById('total-orders').textContent = filteredData.length;
    document.getElementById('no-of-pizza-types').textContent = [...new Set(filteredData.map(data => data.pizza_type_id))].length;
    const totalRevenue = revenue.reduce((acc, curr) => acc + curr, 0);
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
    const averageRevenue = totalRevenue / (revenue.length || 1);
    document.getElementById('average-revenue').textContent = `$${averageRevenue.toFixed(2)}`;

    
    const totalPizzaSales = filteredData.reduce((acc, curr) => acc + parseInt(curr.quantity), 0);
    document.getElementById('total-pizza-sales').textContent = totalPizzaSales;

    
    const ctx1 = document.getElementById('myChart1');
    chart1 = new Chart(ctx1, {
      type: 'line',
      data: {
        datasets: [{
          label: "Revenue MoM",
          data: revenue
        }],
        labels: selectedMonths.map(month => months[month - 1]) 
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            grid: {
              display: false
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        maintainAspectRatio: false
      }
    });

    
    const ctx2 = document.getElementById('myChart2');
    chart2 = new Chart(ctx2, {
      type: 'bar',
      data: {
        datasets: [{
          label: "Sales per Month",
          data: order
        }],
        labels: selectedMonths.map(month => months[month - 1]) 
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: false
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        maintainAspectRatio: false
      },
      plugins: [ChartDataLabels]
    });

    
    const ctx3 = document.getElementById('myChart3').getContext('2d');
    chart3 = new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: selectedMonths.map(month => months[month - 1]), 
        datasets: [
          {
            label: 'Revenue',
            type: 'line',
            data: revenue,
            borderWidth: 3,
            borderColor: '#5fbaff',
            backgroundColor: '#5fbaff',
            pointRadius: 0,
            pointHoverRadius: 4,
            pointBackgroundColor: '#5fbaff',
            pointBorderColor: '#5fbaff',
            pointHoverBackgroundColor: '#5fbaff',
            pointHoverBorderColor: '#5fbaff',
            pointStyle: 'circle',
            datalabels: {
              display: false
            }
          },
          {
            label: 'Order Count',
            type: 'bar',
            data: order,
            borderWidth: 1
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: false
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          annotation: {
            annotations: revenue.map((value, index) => ({
              type: 'line',
              scaleID: 'y',
              value: value,
              borderColor: 'rgba(255, 99, 132, 0.5)',
              borderWidth: 2,
              label: {
                content: `Revenue: ${value}`,
                enabled: true,
                position: 'right'
              }
            }))
          }
        },
        maintainAspectRatio: false
      },
      plugins: [ChartDataLabels]
    });

    
    const ctx4 = document.getElementById('myChart4');
    chart4 = new Chart(ctx4, {
      type: 'pie',
      data: {
        datasets: [{
          data: ordsize.map(item => item.value),
          backgroundColor: ['#7FCFFF', '#6AC0FF', '#5AA5E6', '#57A6E6', '#4D93CC'],
        }],
        labels: ordsize.map(item => item.label)
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
            formatter: (value, ctx) => {
              const totalSum = ctx.dataset.data.reduce((acc, curr) => acc + curr, 0);
              const percentage = value / totalSum * 100;
              return `${percentage.toFixed(1)}%`;
            }
          },
          legend: {
            position: 'right'
          },
          title: {
            display: true,
            text: 'Order by Pizza Size',
            position: 'top',
            font: {
              size: 10
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });

    
    const ctx5 = document.getElementById('myChart5');
    chart5 = new Chart(ctx5, {
      type: 'bar',
      data: {
        datasets: [{
          label: "Order by Category",
          data: ordcategory
        }],
        labels: ["Classic", "Supreme", "Vegie", "Chicken"]
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: false
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  };

  document.getElementById('month-select').addEventListener('change', updateCharts);
  document.getElementById('pizza-select').addEventListener('change', updateCharts);

  
  updateCharts();
});
