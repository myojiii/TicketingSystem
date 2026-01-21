// Reports Dashboard JavaScript

// Global chart instances
let categoryPieChart = null;
let categoryBarChart = null;
let resolutionCategoryChart = null;
let resolutionStaffChart = null;
let trendsChart = null;

// Current filters
let currentFilters = {
  startDate: "",
  endDate: "",
  department: "all",
  priority: "all",
  staffId: "all",
};

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  initializeSidebar();
  loadFilterOptions();
  setupEventListeners();
  loadDefaultReport();
});

// Initialize sidebar toggle
function initializeSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.getElementById("sidebar-toggle");
  const logoutBtn = document.getElementById("logout-btn");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      window.location.href = "/";
    });
  }
}

// Load filter options from API
async function loadFilterOptions() {
  try {
    const response = await fetch("/api/reports/filters");
    const data = await response.json();

    // Populate department filter
    const departmentSelect = document.getElementById("filter-department");
    const allDepartments = Array.from(
      new Set([...(data.departments || []), ...(data.categories || [])])
    ).filter(Boolean);
    allDepartments.forEach((dept) => {
      const option = document.createElement("option");
      option.value = dept;
      option.textContent = dept;
      departmentSelect.appendChild(option);
    });

    // Populate staff filter
    const staffSelect = document.getElementById("filter-staff");
    data.staff.forEach((staff) => {
      const option = document.createElement("option");
      option.value = staff.id;
      option.textContent = `${staff.name} (${staff.department || "N/A"})`;
      staffSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading filter options:", error);
    showNotification("Failed to load filter options", "error");
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const reportType = btn.dataset.report;
      switchReport(reportType);
    });
  });

  // Apply filters
  document.getElementById("apply-filters").addEventListener("click", applyFilters);

  // Reset filters
  document.getElementById("reset-filters").addEventListener("click", resetFilters);

  // Trends groupby change
  document.getElementById("trends-groupby").addEventListener("change", () => {
    loadTicketVolumeTrends();
  });

  // Export buttons
  document.querySelectorAll(".btn-export").forEach((btn) => {
    btn.addEventListener("click", () => {
      const reportType = btn.dataset.export;
      exportReport(reportType);
    });
  });
}

// Switch between report tabs
function switchReport(reportType) {
  // Update tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelector(`[data-report="${reportType}"]`).classList.add("active");

  // Update report sections
  document.querySelectorAll(".report-section").forEach((section) => {
    section.classList.remove("active");
  });
  document.getElementById(`report-${reportType}`).classList.add("active");

  // Load report data
  loadReportData(reportType);
}

// Apply filters
function applyFilters() {
  currentFilters.startDate = document.getElementById("start-date").value;
  currentFilters.endDate = document.getElementById("end-date").value;
  currentFilters.department = document.getElementById("filter-department").value;
  currentFilters.priority = document.getElementById("filter-priority").value;
  currentFilters.staffId = document.getElementById("filter-staff").value;

  // Reload current active report
  const activeTab = document.querySelector(".tab-btn.active");
  const reportType = activeTab.dataset.report;
  loadReportData(reportType);

  showNotification("Filters applied successfully", "success");
}

// Reset filters
function resetFilters() {
  document.getElementById("start-date").value = "";
  document.getElementById("end-date").value = "";
  document.getElementById("filter-department").value = "all";
  document.getElementById("filter-priority").value = "all";
  document.getElementById("filter-staff").value = "all";

  currentFilters = {
    startDate: "",
    endDate: "",
    department: "all",
    priority: "all",
    staffId: "all",
  };

  // Reload current active report
  const activeTab = document.querySelector(".tab-btn.active");
  const reportType = activeTab.dataset.report;
  loadReportData(reportType);

  showNotification("Filters reset", "success");
}

// Load report data based on type
function loadReportData(reportType) {
  switch (reportType) {
    case "category":
      loadTicketsPerCategory();
      break;
    case "resolution":
      loadResolutionTimeAnalysis();
      break;
    case "trends":
      loadTicketVolumeTrends();
      break;
  }
}

// Load default report on page load
function loadDefaultReport() {
  loadTicketsPerCategory();
}

// 1. Load Tickets per Category Report
async function loadTicketsPerCategory() {
  try {
    showLoading();

    const params = new URLSearchParams({
      ...(currentFilters.startDate && { startDate: currentFilters.startDate }),
      ...(currentFilters.endDate && { endDate: currentFilters.endDate }),
      ...(currentFilters.department !== "all" && { department: currentFilters.department }),
    });

    const response = await fetch(`/api/reports/category?${params}`);
    const data = await response.json();

    // Update stats cards
    document.getElementById("category-total").textContent = data.total;
    document.getElementById("category-count").textContent = data.categories.length;

    // Update table
    updateCategoryTable(data.categories);

    // Update charts
    updateCategoryCharts(data.categories);

    hideLoading();
  } catch (error) {
    console.error("Error loading category report:", error);
    showNotification("Failed to load category report", "error");
    hideLoading();
  }
}

// Update category table
function updateCategoryTable(categories) {
  const tbody = document.querySelector("#category-table tbody");
  tbody.innerHTML = "";

  if (categories.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 40px; color: #666;">
          No data available
        </td>
      </tr>
    `;
    return;
  }

  categories.forEach((cat) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${cat.category}</td>
      <td>${cat.count}</td>
      <td>${cat.percentage}%</td>
    `;
    tbody.appendChild(row);
  });
}

// Update category charts
function updateCategoryCharts(categories) {
  const labels = categories.map((c) => c.category);
  const counts = categories.map((c) => c.count);
  const colors = generateColors(categories.length);

  // Pie Chart
  const pieCtx = document.getElementById("category-pie-chart").getContext("2d");
  if (categoryPieChart) {
    categoryPieChart.destroy();
  }
  categoryPieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [
        {
          data: counts,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 15,
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  });

  // Bar Chart
  const barCtx = document.getElementById("category-bar-chart").getContext("2d");
  if (categoryBarChart) {
    categoryBarChart.destroy();
  }
  categoryBarChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Tickets",
          data: counts,
          backgroundColor: "rgba(79, 70, 229, 0.8)",
          borderColor: "rgba(79, 70, 229, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  });
}

// 2. Load Resolution Time Analysis Report
async function loadResolutionTimeAnalysis() {
  try {
    showLoading();

    const params = new URLSearchParams({
      ...(currentFilters.startDate && { startDate: currentFilters.startDate }),
      ...(currentFilters.endDate && { endDate: currentFilters.endDate }),
      ...(currentFilters.category !== "all" && { category: currentFilters.category }),
      ...(currentFilters.priority !== "all" && { priority: currentFilters.priority }),
      ...(currentFilters.staffId !== "all" && { staffId: currentFilters.staffId }),
    });

    const response = await fetch(`/api/reports/resolution?${params}`);
    const data = await response.json();

    // Update stats cards
    document.getElementById("resolution-total").textContent = data.totalResolved;
    document.getElementById("resolution-avg").textContent = data.averageResolutionTime;
    document.getElementById("resolution-fastest").textContent = data.fastestResolution;
    document.getElementById("resolution-slowest").textContent = data.slowestResolution;

    // Update overdue table
    updateOverdueTable(data.overdue);

    // Update charts
    updateResolutionCharts(data.byCategory, data.byStaff);

    hideLoading();
  } catch (error) {
    console.error("Error loading resolution report:", error);
    showNotification("Failed to load resolution report", "error");
    hideLoading();
  }
}

// Update overdue table
function updateOverdueTable(overdueTickets) {
  const tbody = document.querySelector("#overdue-table tbody");
  tbody.innerHTML = "";

  if (overdueTickets.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
          No overdue tickets
        </td>
      </tr>
    `;
    return;
  }

  overdueTickets.forEach((ticket) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${ticket.id}</td>
      <td>${ticket.title}</td>
      <td>${ticket.category}</td>
      <td>${ticket.priority}</td>
      <td>${ticket.assignedTo}</td>
      <td>${ticket.ageHours}</td>
      <td>${ticket.status}</td>
    `;
    tbody.appendChild(row);
  });
}

// Update resolution charts
function updateResolutionCharts(byCategory, byStaff) {
  // Resolution by Category Chart
  const categoryLabels = byCategory.map((c) => c.category);
  const categoryTimes = byCategory.map((c) => parseFloat(c.averageTime));

  const categoryCtx = document.getElementById("resolution-category-chart").getContext("2d");
  if (resolutionCategoryChart) {
    resolutionCategoryChart.destroy();
  }
  resolutionCategoryChart = new Chart(categoryCtx, {
    type: "bar",
    data: {
      labels: categoryLabels,
      datasets: [
        {
          label: "Avg Resolution Time (hrs)",
          data: categoryTimes,
          backgroundColor: "rgba(245, 87, 108, 0.8)",
          borderColor: "rgba(245, 87, 108, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Hours",
          },
        },
      },
    },
  });

  // Resolution by Staff Chart
  const staffLabels = byStaff.map((s) => s.staffName);
  const staffTimes = byStaff.map((s) => parseFloat(s.averageTime));

  const staffCtx = document.getElementById("resolution-staff-chart").getContext("2d");
  if (resolutionStaffChart) {
    resolutionStaffChart.destroy();
  }
  resolutionStaffChart = new Chart(staffCtx, {
    type: "bar",
    data: {
      labels: staffLabels,
      datasets: [
        {
          label: "Avg Resolution Time (hrs)",
          data: staffTimes,
          backgroundColor: "rgba(74, 172, 254, 0.8)",
          borderColor: "rgba(74, 172, 254, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Hours",
          },
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
    },
  });
}

// 3. Load Ticket Volume Trends Report
async function loadTicketVolumeTrends() {
  try {
    showLoading();

    const groupBy = document.getElementById("trends-groupby").value;

    const params = new URLSearchParams({
      ...(currentFilters.startDate && { startDate: currentFilters.startDate }),
      ...(currentFilters.endDate && { endDate: currentFilters.endDate }),
      groupBy: groupBy,
    });

    const response = await fetch(`/api/reports/trends?${params}`);
    const data = await response.json();

    // Update table
    updateTrendsTable(data.trends);

    // Update chart
    updateTrendsChart(data.trends);

    hideLoading();
  } catch (error) {
    console.error("Error loading trends report:", error);
    showNotification("Failed to load trends report", "error");
    hideLoading();
  }
}

// Update trends table
function updateTrendsTable(trends) {
  const tbody = document.querySelector("#trends-table tbody");
  tbody.innerHTML = "";

  if (trends.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px; color: #666;">
          No data available
        </td>
      </tr>
    `;
    return;
  }

  trends.forEach((trend) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${trend.period}</td>
      <td>${trend.opened}</td>
      <td>${trend.resolved}</td>
      <td>${trend.net > 0 ? "+" : ""}${trend.net}</td>
    `;
    tbody.appendChild(row);
  });
}

// Update trends chart
function updateTrendsChart(trends) {
  const labels = trends.map((t) => t.period);
  const opened = trends.map((t) => t.opened);
  const resolved = trends.map((t) => t.resolved);

  const ctx = document.getElementById("trends-chart").getContext("2d");
  if (trendsChart) {
    trendsChart.destroy();
  }
  trendsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Tickets Opened",
          data: opened,
          borderColor: "rgba(239, 68, 68, 1)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        },
        {
          label: "Tickets Resolved",
          data: resolved,
          borderColor: "rgba(16, 185, 129, 1)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  });
}

// Export report
async function exportReport(reportType) {
  try {
    showLoading();

    const params = new URLSearchParams({
      reportType: reportType,
      format: "csv",
      ...(currentFilters.startDate && { startDate: currentFilters.startDate }),
      ...(currentFilters.endDate && { endDate: currentFilters.endDate }),
      ...(currentFilters.department !== "all" && { department: currentFilters.department }),
      ...(currentFilters.category !== "all" && { category: currentFilters.category }),
      ...(currentFilters.priority !== "all" && { priority: currentFilters.priority }),
      ...(currentFilters.staffId !== "all" && { staffId: currentFilters.staffId }),
      ...(reportType === "trends" && { groupBy: document.getElementById("trends-groupby").value }),
    });

    const response = await fetch(`/api/reports/export?${params}`);
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_report_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showNotification("Report exported successfully", "success");
    hideLoading();
  } catch (error) {
    console.error("Error exporting report:", error);
    showNotification("Failed to export report", "error");
    hideLoading();
  }
}

// Utility: Generate colors for charts
function generateColors(count) {
  const colors = [
    "rgba(79, 70, 229, 0.8)",
    "rgba(245, 87, 108, 0.8)",
    "rgba(74, 172, 254, 0.8)",
    "rgba(67, 233, 123, 0.8)",
    "rgba(251, 146, 60, 0.8)",
    "rgba(168, 85, 247, 0.8)",
    "rgba(236, 72, 153, 0.8)",
    "rgba(14, 165, 233, 0.8)",
  ];

  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
}

// Show loading overlay
function showLoading() {
  const overlay = document.createElement("div");
  overlay.className = "loading-overlay";
  overlay.id = "loading-overlay";
  overlay.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(overlay);
}

// Hide loading overlay
function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.remove();
  }
}

// Show notification
function showNotification(message, type = "success") {
  const container = document.getElementById("notification-container");
  
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-icon">
      <svg viewBox="0 0 24 24">
        ${
          type === "success"
            ? '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>'
            : '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>'
        }
      </svg>
    </div>
    <div class="notification-message">${message}</div>
  `;

  container.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
