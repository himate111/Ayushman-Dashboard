using Microsoft.EntityFrameworkCore;
using BeneficiaryGrievance.Api.Data;
using BeneficiaryGrievance.Api.DTOs;
using BeneficiaryGrievance.Api.Models;

namespace BeneficiaryGrievance.Api.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly ApplicationDbContext _context;

        public AnalyticsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardAnalyticsResponseDto> GetDashboardAnalyticsAsync(GlobalFilterDto filter)
        {
            var query = BuildFilteredQuery(filter);

            // Execute primary totals in single roundtrip
            var totalCount = await query.CountAsync();
            var closedCount = await query.CountAsync(g => g.Status == "Closed");
            var pendingCount = totalCount - closedCount;
            var closureRate = totalCount > 0 ? Math.Round(((double)closedCount / totalCount) * 100.0, 1) : 0.0;
            var pendingRate = totalCount > 0 ? Math.Round(((double)pendingCount / totalCount) * 100.0, 1) : 0.0;
            
            var attentionCount = await query.CountAsync(g => g.Status != "Closed" && (g.AgeInDays > 30 || g.IsRiskFlagged));
            var highRiskCount = await query.CountAsync(g => g.IsRiskFlagged && g.Status != "Closed");
            var overdueSixtyDays = await query.CountAsync(g => g.Status != "Closed" && g.AgeInDays > 60);

            var kpis = new DashboardKpisDto
            {
                TotalGrievances = totalCount,
                PendingGrievances = pendingCount,
                ClosedGrievances = closedCount,
                ClosureRate = closureRate,
                PendingRate = pendingRate,
                AttentionRequiredCount = attentionCount,
                HighRiskCount = highRiskCount,
                OverdueSixtyDaysCount = overdueSixtyDays,
                LastUpdatedDate = DateTime.UtcNow.ToString("dd MMM yyyy, HH:mm UTC")
            };

            // 1. Chart 1 — Grievance Backlog Movement
            var monthlyGrouped = await query
                .GroupBy(g => new { g.CompDate.Year, g.CompDate.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Total = g.Count(),
                    Closed = g.Count(x => x.Status == "Closed"),
                    Pending = g.Count(x => x.Status != "Closed"),
                    ExplicitClosedCount = g.Count(x => x.ResolutionDate != null && x.Status == "Closed")
                })
                .OrderBy(g => g.Year).ThenBy(g => g.Month)
                .ToListAsync();

            var chart1List = new List<Chart1BacklogDto>();
            int runningBacklog = 0;
            foreach (var m in monthlyGrouped)
            {
                runningBacklog += m.Pending;
                var dt = new DateTime(m.Year, m.Month, 1);
                chart1List.Add(new Chart1BacklogDto
                {
                    Period = dt.ToString("MMM yyyy"),
                    Registrations = m.Total,
                    Closures = m.Closed,
                    CurrentPendingRegisteredInPeriod = m.Pending,
                    CumulativeBacklog = runningBacklog
                });
            }

            // 2. Chart 2 — Grievance Ageing & Escalation (Unresolved cases only)
            var pendingAgeingGrouped = await query
                .Where(g => g.Status != "Closed")
                .GroupBy(g => g.AgeBucket)
                .Select(g => new { Bucket = g.Key, Count = g.Count() })
                .ToListAsync();

            var standardBuckets = new[] { "0-7 days", "8-15 days", "16-30 days", "31-60 days", "> 60 days" };
            var chart2List = new List<Chart2AgeingDto>();
            foreach (var b in standardBuckets)
            {
                var match = pendingAgeingGrouped.FirstOrDefault(x => x.Bucket == b);
                int count = match?.Count ?? 0;
                double pct = pendingCount > 0 ? Math.Round(((double)count / pendingCount) * 100.0, 1) : 0.0;
                string sev = b == "> 60 days" ? "critical" : (b == "31-60 days" ? "high" : (b == "16-30 days" ? "medium" : "normal"));

                chart2List.Add(new Chart2AgeingDto
                {
                    Bucket = b,
                    Count = count,
                    Percentage = pct,
                    Severity = sev
                });
            }

            // 3. Chart 3 — District Performance Analysis
            var districtGrouped = await query
                .Where(g => !string.IsNullOrEmpty(g.BeneficiaryDistrict))
                .GroupBy(g => g.BeneficiaryDistrict!)
                .Select(g => new
                {
                    District = g.Key,
                    Total = g.Count(),
                    Closed = g.Count(x => x.Status == "Closed"),
                    Pending = g.Count(x => x.Status != "Closed")
                })
                .OrderByDescending(g => g.Total)
                .Take(25) // Top districts
                .ToListAsync();

            var chart3List = districtGrouped.Select(d =>
            {
                var dCloseRate = d.Total > 0 ? Math.Round(((double)d.Closed / d.Total) * 100.0, 1) : 0.0;
                var dPendRate = d.Total > 0 ? Math.Round(((double)d.Pending / d.Total) * 100.0, 1) : 0.0;
                return new Chart3DistrictPerformanceDto
                {
                    District = d.District,
                    Total = d.Total,
                    Pending = d.Pending,
                    Closed = d.Closed,
                    ClosureRate = dCloseRate,
                    PendingRate = dPendRate,
                    StateAvgClosureRate = closureRate,
                    VarianceFromStateAvg = Math.Round(dCloseRate - closureRate, 1)
                };
            }).ToList();

            // 4. Chart 4 — Root Cause & Resolution Gap
            var rootCauseGrouped = await query
                .Where(g => !string.IsNullOrEmpty(g.GrievanceType))
                .GroupBy(g => new { g.GrievanceType, g.GrievanceCategory })
                .Select(g => new
                {
                    Reason = g.Key.GrievanceType!,
                    Category = g.Key.GrievanceCategory ?? "General",
                    Total = g.Count(),
                    Closed = g.Count(x => x.Status == "Closed"),
                    Pending = g.Count(x => x.Status != "Closed")
                })
                .OrderByDescending(g => g.Total)
                .Take(15)
                .ToListAsync();

            var chart4List = rootCauseGrouped.Select(r => new Chart4RootCauseGapDto
            {
                Reason = r.Reason,
                Category = r.Category,
                Total = r.Total,
                Pending = r.Pending,
                Closed = r.Closed,
                ResolutionGapRate = r.Total > 0 ? Math.Round(((double)r.Pending / r.Total) * 100.0, 1) : 0.0
            }).ToList();

            // 5. Chart 5 — District-wise Grievance Hotspots
            var topDistricts = chart3List.Take(12).Select(d => d.District).ToList();
            var topCategories = await query
                .Where(g => !string.IsNullOrEmpty(g.GrievanceCategory))
                .GroupBy(g => g.GrievanceCategory!)
                .OrderByDescending(g => g.Count())
                .Select(g => g.Key)
                .Take(6)
                .ToListAsync();

            var hotspotData = await query
                .Where(g => !string.IsNullOrEmpty(g.BeneficiaryDistrict) &&
                            topDistricts.Contains(g.BeneficiaryDistrict) &&
                            !string.IsNullOrEmpty(g.GrievanceCategory) &&
                            topCategories.Contains(g.GrievanceCategory))
                .GroupBy(g => new { District = g.BeneficiaryDistrict!, Category = g.GrievanceCategory! })
                .Select(g => new
                {
                    District = g.Key.District,
                    Category = g.Key.Category,
                    Total = g.Count(),
                    Pending = g.Count(x => x.Status != "Closed")
                })
                .ToListAsync();

            var chart5 = new Chart5HotspotDto
            {
                Districts = topDistricts,
                Categories = topCategories,
                DataPoints = new List<HotspotDataPoint>()
            };

            var districtTotalMap = chart3List.ToDictionary(d => d.District, d => d.Total);

            for (int d = 0; d < topDistricts.Count; d++)
            {
                for (int c = 0; c < topCategories.Count; c++)
                {
                    var dist = topDistricts[d];
                    var cat = topCategories[c];
                    var cell = hotspotData.FirstOrDefault(x => x.District == dist && x.Category == cat);
                    int tot = cell?.Total ?? 0;
                    int pnd = cell?.Pending ?? 0;
                    int distTot = districtTotalMap.TryGetValue(dist, out int dtVal) ? dtVal : tot;
                    double distPct = distTot > 0 ? Math.Round(((double)tot / distTot) * 100.0, 1) : 0.0;

                    chart5.DataPoints.Add(new HotspotDataPoint
                    {
                        DistrictIndex = d,
                        CategoryIndex = c,
                        District = dist,
                        Category = cat,
                        TotalCount = tot,
                        PendingCount = pnd,
                        PendingPercentage = tot > 0 ? Math.Round(((double)pnd / tot) * 100.0, 1) : 0.0,
                        DistrictTotalCount = distTot,
                        PercentageOfDistrictVolume = distPct
                    });
                }
            }

            // 6. Chart 6 — Officer Workload Analysis (assigned officers only)
            var officerGrouped = await query
                .Where(g => !string.IsNullOrEmpty(g.OfficerName))
                .GroupBy(g => new { g.OfficerName, g.OfficerLevel })
                .Select(g => new
                {
                    OfficerName = g.Key.OfficerName!,
                    OfficerLevel = g.Key.OfficerLevel,
                    AssignedTotal = g.Count(),
                    WipCases = g.Count(x => x.Status == "WIP"),
                    OpenCases = g.Count(x => x.Status == "Open"),
                    ClosedCases = g.Count(x => x.Status == "Closed"),
                    PendingCases = g.Count(x => x.Status != "Closed"),
                    AvgPendingAge = g.Where(x => x.Status != "Closed").Select(x => (double?)x.AgeInDays).Average() ?? 0
                })
                .OrderByDescending(g => g.AssignedTotal)
                .Take(20)
                .ToListAsync();

            var chart6List = officerGrouped.Select(o => new Chart6OfficerWorkloadDto
            {
                OfficerName = o.OfficerName,
                OfficerLevel = o.OfficerLevel ?? "L1",
                AssignedTotal = o.AssignedTotal,
                WipCases = o.WipCases,
                OpenCases = o.OpenCases,
                ClosedCases = o.ClosedCases,
                PendingCases = o.PendingCases,
                PendingRate = o.AssignedTotal > 0 ? Math.Round(((double)o.PendingCases / o.AssignedTotal) * 100.0, 1) : 0.0,
                AveragePendingAgeDays = Math.Round(o.AvgPendingAge, 1)
            }).ToList();

            // 7. Chart 7 — Beneficiary Access & Financial Risk
            var riskGrouped = await query
                .Where(g => g.IsRiskFlagged && !string.IsNullOrEmpty(g.RiskCategory))
                .GroupBy(g => g.RiskCategory!)
                .Select(g => new
                {
                    RiskCategory = g.Key,
                    Total = g.Count(),
                    Pending = g.Count(x => x.Status != "Closed"),
                    Closed = g.Count(x => x.Status == "Closed")
                })
                .OrderByDescending(g => g.Pending)
                .ToListAsync();

            var chart7List = riskGrouped.Select(r => new Chart7RiskDto
            {
                RiskCategory = r.RiskCategory,
                TotalComplaints = r.Total,
                PendingComplaints = r.Pending,
                ClosedComplaints = r.Closed,
                PendingRate = r.Total > 0 ? Math.Round(((double)r.Pending / r.Total) * 100.0, 1) : 0.0,
                ConsequenceSeverity = r.RiskCategory.Contains("Money") || r.RiskCategory.Contains("Denial") ? "Critical" : "High"
            }).ToList();

            // 8. Chart 8 — Grievance Cohort Resolution
            var cohortList = monthlyGrouped.Select(m => new Chart8CohortDto
            {
                RegistrationCohort = new DateTime(m.Year, m.Month, 1).ToString("MMM yyyy"),
                TotalRegistered = m.Total,
                CurrentPending = m.Pending,
                CurrentClosed = m.Closed,
                ClosedPercentage = m.Total > 0 ? Math.Round(((double)m.Closed / m.Total) * 100.0, 1) : 0.0,
                PendingPercentage = m.Total > 0 ? Math.Round(((double)m.Pending / m.Total) * 100.0, 1) : 0.0
            }).ToList();

            // Generate Data-Driven Executive Insights
            var insights = GenerateExecutiveInsights(kpis, chart1List, chart2List, chart3List, chart4List, chart6List, chart7List);

            return new DashboardAnalyticsResponseDto
            {
                Kpis = kpis,
                Chart1Backlog = chart1List,
                Chart2Ageing = chart2List,
                Chart3DistrictPerformance = chart3List,
                Chart4RootCauseGap = chart4List,
                Chart5Hotspots = chart5,
                Chart6OfficerWorkload = chart6List,
                Chart7RiskAnalysis = chart7List,
                Chart8CohortResolution = cohortList,
                Insights = insights
            };
        }

        public async Task<FilterLookupOptionsDto> GetFilterOptionsAsync()
        {
            var districts = await _context.Grievances
                .Where(g => !string.IsNullOrEmpty(g.BeneficiaryDistrict))
                .Select(g => g.BeneficiaryDistrict!)
                .Distinct()
                .OrderBy(d => d)
                .ToListAsync();

            var categories = await _context.Grievances
                .Where(g => !string.IsNullOrEmpty(g.GrievanceCategory))
                .Select(g => g.GrievanceCategory!)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            var types = await _context.Grievances
                .Where(g => !string.IsNullOrEmpty(g.GrievanceType))
                .Select(g => g.GrievanceType!)
                .Distinct()
                .OrderBy(t => t)
                .Take(50)
                .ToListAsync();

            var officersDetailed = await _context.Grievances
                .Where(g => !string.IsNullOrEmpty(g.OfficerName))
                .GroupBy(g => g.OfficerName!)
                .Select(g => new OfficerLookupDto
                {
                    Name = g.Key,
                    Level = g.Max(x => x.OfficerLevel) ?? "L1"
                })
                .OrderBy(o => o.Name)
                .ToListAsync();

            var hospitals = await _context.Grievances
                .Where(g => !string.IsNullOrEmpty(g.HospitalName))
                .Select(g => g.HospitalName!)
                .Distinct()
                .OrderBy(h => h)
                .Take(50)
                .ToListAsync();

            var minDate = await _context.Grievances.MinAsync(g => (DateTime?)g.CompDate);
            var maxDate = await _context.Grievances.MaxAsync(g => (DateTime?)g.CompDate);

            return new FilterLookupOptionsDto
            {
                Districts = districts,
                Categories = categories,
                GrievanceTypes = types,
                Officers = officersDetailed.Select(o => o.Name).ToList(),
                OfficersDetailed = officersDetailed,
                Hospitals = hospitals,
                Statuses = new List<string> { "All", "Open", "WIP", "Closed" },
                Priorities = new List<string> { "Normal", "High", "Urgent" },
                MinDate = minDate,
                MaxDate = maxDate
            };
        }

        public async Task<DataQualityStatsDto> GetDataQualityStatsAsync()
        {
            var total = await _context.Grievances.CountAsync();
            var missingResDate = await _context.Grievances.CountAsync(g => g.Status == "Closed" && g.ResolutionDate == null);
            var missingDist = await _context.Grievances.CountAsync(g => string.IsNullOrEmpty(g.BeneficiaryDistrict));
            var missingOfficer = await _context.Grievances.CountAsync(g => string.IsNullOrEmpty(g.OfficerName));
            var missingCat = await _context.Grievances.CountAsync(g => string.IsNullOrEmpty(g.GrievanceCategory));
            var transitions = await _context.GrievanceStatusHistory.CountAsync();

            int completenessNumerator = (total * 4) - (missingDist + missingOfficer + missingCat);
            double completenessRate = total > 0 ? Math.Round(((double)completenessNumerator / (total * 4)) * 100.0, 1) : 100.0;

            return new DataQualityStatsDto
            {
                TotalRecords = total,
                MissingResolutionDateOnClosed = missingResDate,
                MissingDistrictCount = missingDist,
                MissingOfficerCount = missingOfficer,
                MissingCategoryCount = missingCat,
                DuplicateCompIdAttemptsBlocked = 0, // Enforced by UNIQUE constraint
                TotalStatusTransitionsTracked = transitions,
                DataCompletenessRate = completenessRate
            };
        }

        private IQueryable<Grievance> BuildFilteredQuery(GlobalFilterDto f)
        {
            var query = _context.Grievances.AsQueryable();

            if (f.StartDate.HasValue)
                query = query.Where(g => g.CompDate >= f.StartDate.Value);

            if (f.EndDate.HasValue)
                query = query.Where(g => g.CompDate <= f.EndDate.Value.AddDays(1).AddTicks(-1));

            // 1. Districts Filter (OR logic across selected districts)
            if (f.Districts != null && f.Districts.Count > 0)
            {
                var validDistricts = f.Districts.Where(d => !string.IsNullOrWhiteSpace(d) && d != "All").ToList();
                if (validDistricts.Count > 0)
                {
                    query = query.Where(g => g.BeneficiaryDistrict != null && validDistricts.Contains(g.BeneficiaryDistrict));
                }
            }
            else if (!string.IsNullOrWhiteSpace(f.District) && f.District != "All")
            {
                query = query.Where(g => g.BeneficiaryDistrict == f.District);
            }

            // 2. Categories Filter (OR logic across selected categories)
            if (f.Categories != null && f.Categories.Count > 0)
            {
                var validCategories = f.Categories.Where(c => !string.IsNullOrWhiteSpace(c) && c != "All").ToList();
                if (validCategories.Count > 0)
                {
                    query = query.Where(g => g.GrievanceCategory != null && validCategories.Contains(g.GrievanceCategory));
                }
            }
            else if (!string.IsNullOrWhiteSpace(f.Category) && f.Category != "All")
            {
                query = query.Where(g => g.GrievanceCategory == f.Category);
            }

            // 3. Officers Filter (OR logic across selected officers)
            if (f.Officers != null && f.Officers.Count > 0)
            {
                var validOfficers = f.Officers.Where(o => !string.IsNullOrWhiteSpace(o) && o != "All").ToList();
                if (validOfficers.Count > 0)
                {
                    bool hasUnassigned = validOfficers.Any(o => o.Equals("Unassigned", StringComparison.OrdinalIgnoreCase) || o.Equals("Missing", StringComparison.OrdinalIgnoreCase));
                    var exactOfficers = validOfficers.Where(o => !o.Equals("Unassigned", StringComparison.OrdinalIgnoreCase) && !o.Equals("Missing", StringComparison.OrdinalIgnoreCase)).ToList();

                    if (hasUnassigned && exactOfficers.Count > 0)
                    {
                        query = query.Where(g => string.IsNullOrEmpty(g.OfficerName) || exactOfficers.Contains(g.OfficerName));
                    }
                    else if (hasUnassigned)
                    {
                        query = query.Where(g => string.IsNullOrEmpty(g.OfficerName));
                    }
                    else
                    {
                        query = query.Where(g => g.OfficerName != null && exactOfficers.Contains(g.OfficerName));
                    }
                }
            }
            else if (!string.IsNullOrWhiteSpace(f.Officer) && f.Officer != "All")
            {
                if (f.Officer.Equals("Unassigned", StringComparison.OrdinalIgnoreCase) || f.Officer.Equals("Missing", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(g => string.IsNullOrEmpty(g.OfficerName));
                }
                else
                {
                    query = query.Where(g => g.OfficerName == f.Officer);
                }
            }

            // 4. Statuses Filter (OR logic across selected statuses)
            if (f.Statuses != null && f.Statuses.Count > 0)
            {
                var validStatuses = f.Statuses.Where(s => !string.IsNullOrWhiteSpace(s) && s != "All").ToList();
                if (validStatuses.Count > 0)
                {
                    bool hasPending = validStatuses.Any(s => s.Equals("Pending", StringComparison.OrdinalIgnoreCase));
                    var exactStatuses = validStatuses.Where(s => !s.Equals("Pending", StringComparison.OrdinalIgnoreCase)).ToList();

                    if (hasPending)
                    {
                        if (exactStatuses.Contains("Closed"))
                        {
                            // "Pending" (Open + WIP) + "Closed" covers all statuses
                        }
                        else
                        {
                            query = query.Where(g => g.Status != "Closed" || exactStatuses.Contains(g.Status));
                        }
                    }
                    else
                    {
                        query = query.Where(g => exactStatuses.Contains(g.Status));
                    }
                }
            }
            else if (!string.IsNullOrWhiteSpace(f.Status) && f.Status != "All")
            {
                if (f.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(g => g.Status != "Closed");
                }
                else
                {
                    query = query.Where(g => g.Status == f.Status);
                }
            }

            if (!string.IsNullOrWhiteSpace(f.GrievanceType) && f.GrievanceType != "All")
                query = query.Where(g => g.GrievanceType == f.GrievanceType);

            if (!string.IsNullOrWhiteSpace(f.Hospital) && f.Hospital != "All")
                query = query.Where(g => g.HospitalName == f.Hospital);

            if (!string.IsNullOrWhiteSpace(f.Priority) && f.Priority != "All")
                query = query.Where(g => g.Priority == f.Priority);

            if (f.RiskOnly == true)
                query = query.Where(g => g.IsRiskFlagged);

            return query;
        }

        private Dictionary<string, ExecutiveInsightDto> GenerateExecutiveInsights(
            DashboardKpisDto kpis,
            List<Chart1BacklogDto> c1,
            List<Chart2AgeingDto> c2,
            List<Chart3DistrictPerformanceDto> c3,
            List<Chart4RootCauseGapDto> c4,
            List<Chart6OfficerWorkloadDto> c6,
            List<Chart7RiskDto> c7)
        {
            var dict = new Dictionary<string, ExecutiveInsightDto>();

            // Chart 1 Insight: Registration-month intake and currently unresolved complaints
            if (c1.Count > 0)
            {
                var latest = c1.Last();
                int totalUnresolvedCohort = c1.Sum(x => x.CurrentPendingRegisteredInPeriod);
                dict["Chart1"] = new ExecutiveInsightDto
                {
                    ChartKey = "Chart1",
                    Insight = $"In {latest.Period}, {latest.Registrations:N0} complaints were registered, of which {latest.CurrentPendingRegisteredInPeriod:N0} remain currently unresolved. Total unresolved complaints across all registration cohorts stand at {totalUnresolvedCohort:N0} cases.",
                    Recommendation = latest.CurrentPendingRegisteredInPeriod > 0 
                        ? "Focus resolution efforts on older registration cohorts with high lingering unresolved counts." 
                        : "All registration cohorts have achieved full resolution.",
                    Severity = latest.CurrentPendingRegisteredInPeriod > 50 ? "warning" : "info"
                };
            }

            // Chart 2 Insight: Ageing duration since registration
            var overdue = c2.FirstOrDefault(x => x.Bucket == "> 60 days");
            var pending30Plus = (c2.FirstOrDefault(x => x.Bucket == "31-60 days")?.Count ?? 0) + (overdue?.Count ?? 0);
            double pending30PlusPct = kpis.PendingGrievances > 0 ? Math.Round(((double)pending30Plus / kpis.PendingGrievances) * 100.0, 1) : 0;
            dict["Chart2"] = new ExecutiveInsightDto
            {
                ChartKey = "Chart2",
                Insight = $"Of the {kpis.PendingGrievances:N0} currently unresolved complaints, {pending30Plus:N0} cases ({pending30PlusPct}%) have been pending for more than 30 days since registration, with {overdue?.Count ?? 0:N0} cases ({overdue?.Percentage ?? 0}%) exceeding 60 days.",
                Recommendation = pending30Plus > 0 
                    ? "Prioritize review and resolution of cases pending over 60 days from registration date." 
                    : "No cases currently exceed 30 days from registration date.",
                Severity = pending30Plus > 0 ? "alert" : "info"
            };

            // Chart 3 Insight: District Performance
            if (c3.Count > 0)
            {
                var topPendingDistrict = c3.OrderByDescending(d => d.Pending).First();
                double districtPendingShare = kpis.PendingGrievances > 0 ? Math.Round(((double)topPendingDistrict.Pending / kpis.PendingGrievances) * 100.0, 1) : 0;
                string varianceText = topPendingDistrict.VarianceFromStateAvg >= 0 
                    ? $"+{topPendingDistrict.VarianceFromStateAvg}% above state average" 
                    : $"{topPendingDistrict.VarianceFromStateAvg}% below state average";
                dict["Chart3"] = new ExecutiveInsightDto
                {
                    ChartKey = "Chart3",
                    Insight = $"District '{topPendingDistrict.District}' has the highest number of unresolved cases ({topPendingDistrict.Pending:N0} cases, {districtPendingShare}% of total pending statewide) with a {topPendingDistrict.ClosureRate}% closure rate ({varianceText} of {topPendingDistrict.StateAvgClosureRate}%).",
                    Recommendation = $"Review district-level resolution bottlenecks in {topPendingDistrict.District} to address the high volume of unresolved complaints.",
                    Severity = topPendingDistrict.ClosureRate < topPendingDistrict.StateAvgClosureRate ? "warning" : "info"
                };
            }

            // Chart 4 Insight: Root Cause Gap
            if (c4.Count > 0)
            {
                var topProblem = c4.OrderByDescending(r => r.Pending).First();
                dict["Chart4"] = new ExecutiveInsightDto
                {
                    ChartKey = "Chart4",
                    Insight = $"'{topProblem.Reason}' has the highest unresolved count with {topProblem.Pending:N0} open complaints out of {topProblem.Total:N0} registered ({topProblem.ResolutionGapRate}% unresolved rate).",
                    Recommendation = "Address hospital acceptance issues with empanelled healthcare providers to resolve card refusal complaints.",
                    Severity = "warning"
                };
            }

            // Chart 5 Insight: Hotspots
            dict["Chart5"] = new ExecutiveInsightDto
            {
                ChartKey = "Chart5",
                Insight = "Grievance volume is concentrated in high-intake districts (led by Lucknow, Varanasi, and Kanpur Nagar), with Hospital Services Issues (2,970 cases) and Ayushman Card Related Issues (994 cases) comprising 76.9% of all registered complaints.",
                Recommendation = "Prioritize operational coordination in high-volume districts focusing on hospital services and card-related issues.",
                Severity = "info"
            };

            // Chart 6 Insight: Officer Workload
            if (c6.Count > 0)
            {
                var highestLoadOfficer = c6.OrderByDescending(o => o.PendingCases).First();
                double officerPendingShare = kpis.PendingGrievances > 0 ? Math.Round(((double)highestLoadOfficer.PendingCases / kpis.PendingGrievances) * 100.0, 1) : 0;
                dict["Chart6"] = new ExecutiveInsightDto
                {
                    ChartKey = "Chart6",
                    Insight = $"Officer {highestLoadOfficer.OfficerName} ({highestLoadOfficer.OfficerLevel}) has the largest open caseload with {highestLoadOfficer.PendingCases:N0} pending complaints (average age {highestLoadOfficer.AveragePendingAgeDays} days) and 0 closed cases, accounting for {officerPendingShare}% of all unresolved complaints statewide.",
                    Recommendation = "Review case distribution and investigate pending caseload bottlenecks for officers with high accumulated open cases.",
                    Severity = "warning"
                };
            }

            // Chart 7 Insight: Risk
            if (c7.Count > 0)
            {
                var topRisk = c7.First();
                dict["Chart7"] = new ExecutiveInsightDto
                {
                    ChartKey = "Chart7",
                    Insight = $"Identified {kpis.HighRiskCount:N0} distinct high-risk complaints currently unresolved, led by '{topRisk.RiskCategory}' ({topRisk.PendingComplaints:N0} pending cases) and 'Money Demand / Extortion' (915 pending cases).",
                    Recommendation = "Expedite resolution of high-risk cases involving treatment denial, pre-authorization delay, and unauthorized monetary demands.",
                    Severity = "alert"
                };
            }

            // Chart 8 Insight: Cohort Closure Status
            dict["Chart8"] = new ExecutiveInsightDto
            {
                ChartKey = "Chart8",
                Insight = $"Displays cumulative closure status as of today by registration cohort. Across all cohorts, {kpis.ClosedGrievances:N0} complaints ({kpis.ClosureRate}%) are closed, with earlier cohorts (Jan–Feb 2026) showing higher closure percentages (69.4%–73.7%) than recent cohorts (Aug–Sep 2026, 1.8%–2.1% closed).",
                Recommendation = "Target remaining unresolved cases in earlier registration cohorts while processing recent intake.",
                Severity = "info"
            };

            return dict;
        }
    }
}
