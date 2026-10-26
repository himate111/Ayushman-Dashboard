using Microsoft.EntityFrameworkCore;
using BeneficiaryGrievance.Api.Data;
using BeneficiaryGrievance.Api.DTOs;
using BeneficiaryGrievance.Api.Models;

namespace BeneficiaryGrievance.Api.Services
{
    public class GrievanceService : IGrievanceService
    {
        private readonly ApplicationDbContext _context;

        public GrievanceService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResultDto<GrievanceGridItemDto>> GetGrievancesPagedAsync(GrievanceQueryDto q)
        {
            var query = _context.Grievances.AsQueryable();

            if (q.StartDate.HasValue)
                query = query.Where(g => g.CompDate >= q.StartDate.Value);

            if (q.EndDate.HasValue)
                query = query.Where(g => g.CompDate <= q.EndDate.Value.AddDays(1).AddTicks(-1));

            // 1. Districts Filter
            if (q.Districts != null && q.Districts.Count > 0)
            {
                var validDistricts = q.Districts.Where(d => !string.IsNullOrWhiteSpace(d) && d != "All").ToList();
                if (validDistricts.Count > 0)
                {
                    query = query.Where(g => g.BeneficiaryDistrict != null && validDistricts.Contains(g.BeneficiaryDistrict));
                }
            }
            else if (!string.IsNullOrWhiteSpace(q.District) && q.District != "All")
            {
                query = query.Where(g => g.BeneficiaryDistrict == q.District);
            }

            // 2. Categories Filter
            if (q.Categories != null && q.Categories.Count > 0)
            {
                var validCategories = q.Categories.Where(c => !string.IsNullOrWhiteSpace(c) && c != "All").ToList();
                if (validCategories.Count > 0)
                {
                    query = query.Where(g => g.GrievanceCategory != null && validCategories.Contains(g.GrievanceCategory));
                }
            }
            else if (!string.IsNullOrWhiteSpace(q.Category) && q.Category != "All")
            {
                query = query.Where(g => g.GrievanceCategory == q.Category);
            }

            // 3. Officers Filter
            if (q.Officers != null && q.Officers.Count > 0)
            {
                var validOfficers = q.Officers.Where(o => !string.IsNullOrWhiteSpace(o) && o != "All").ToList();
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
            else if (!string.IsNullOrWhiteSpace(q.Officer) && q.Officer != "All")
            {
                if (q.Officer.Equals("Unassigned", StringComparison.OrdinalIgnoreCase) || q.Officer.Equals("Missing", StringComparison.OrdinalIgnoreCase))
                {
                    query = query.Where(g => string.IsNullOrEmpty(g.OfficerName));
                }
                else
                {
                    query = query.Where(g => g.OfficerName == q.Officer);
                }
            }

            // 4. Statuses Filter
            if (q.Statuses != null && q.Statuses.Count > 0)
            {
                var validStatuses = q.Statuses.Where(s => !string.IsNullOrWhiteSpace(s) && s != "All").ToList();
                if (validStatuses.Count > 0)
                {
                    bool hasPending = validStatuses.Any(s => s.Equals("Pending", StringComparison.OrdinalIgnoreCase));
                    var exactStatuses = validStatuses.Where(s => !s.Equals("Pending", StringComparison.OrdinalIgnoreCase)).ToList();

                    if (hasPending)
                    {
                        if (exactStatuses.Contains("Closed"))
                        {
                            // "Pending" + "Closed" matches all statuses
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
            else if (!string.IsNullOrWhiteSpace(q.Status) && q.Status != "All")
            {
                if (q.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
                    query = query.Where(g => g.Status != "Closed");
                else
                    query = query.Where(g => g.Status == q.Status);
            }

            if (!string.IsNullOrWhiteSpace(q.GrievanceType) && q.GrievanceType != "All")
                query = query.Where(g => g.GrievanceType == q.GrievanceType);

            if (!string.IsNullOrWhiteSpace(q.Hospital) && q.Hospital != "All")
                query = query.Where(g => g.HospitalName == q.Hospital);

            if (!string.IsNullOrWhiteSpace(q.Priority) && q.Priority != "All")
                query = query.Where(g => g.Priority == q.Priority);

            if (!string.IsNullOrWhiteSpace(q.AgeBucket) && q.AgeBucket != "All")
                query = query.Where(g => g.AgeBucket == q.AgeBucket);

            if (!string.IsNullOrWhiteSpace(q.RiskCategory) && q.RiskCategory != "All")
                query = query.Where(g => g.RiskCategory == q.RiskCategory);

            if (q.RiskOnly == true)
                query = query.Where(g => g.IsRiskFlagged);

            // Search term across multiple fields
            if (!string.IsNullOrWhiteSpace(q.SearchTerm))
            {
                var term = q.SearchTerm.Trim().ToLowerInvariant();
                if (long.TryParse(term, out long termId))
                {
                    query = query.Where(g => g.CompId == termId || (g.CitizenName != null && g.CitizenName.Contains(term)));
                }
                else
                {
                    query = query.Where(g =>
                        (g.CitizenName != null && g.CitizenName.Contains(term)) ||
                        (g.HospitalName != null && g.HospitalName.Contains(term)) ||
                        (g.BeneficiaryDistrict != null && g.BeneficiaryDistrict.Contains(term)) ||
                        (g.CompRemarks != null && g.CompRemarks.Contains(term)) ||
                        (g.OfficerName != null && g.OfficerName.Contains(term))
                    );
                }
            }

            var totalCount = await query.CountAsync();

            // Dynamic sorting
            query = q.SortBy?.ToLowerInvariant() switch
            {
                "compid" => q.SortDescending ? query.OrderByDescending(g => g.CompId) : query.OrderBy(g => g.CompId),
                "status" => q.SortDescending ? query.OrderByDescending(g => g.Status) : query.OrderBy(g => g.Status),
                "district" => q.SortDescending ? query.OrderByDescending(g => g.BeneficiaryDistrict) : query.OrderBy(g => g.BeneficiaryDistrict),
                "category" => q.SortDescending ? query.OrderByDescending(g => g.GrievanceCategory) : query.OrderBy(g => g.GrievanceCategory),
                "officer" => q.SortDescending ? query.OrderByDescending(g => g.OfficerName) : query.OrderBy(g => g.OfficerName),
                "ageindays" => q.SortDescending ? query.OrderByDescending(g => g.AgeInDays) : query.OrderBy(g => g.AgeInDays),
                _ => q.SortDescending ? query.OrderByDescending(g => g.CompDate) : query.OrderBy(g => g.CompDate)
            };

            int page = Math.Max(1, q.Page);
            int pageSize = Math.Clamp(q.PageSize, 1, 200);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(g => new GrievanceGridItemDto
                {
                    Id = g.Id,
                    CompId = g.CompId,
                    CompDate = g.CompDate.ToString("yyyy-MM-dd"),
                    Status = g.Status,
                    Priority = g.Priority,
                    CitizenName = g.CitizenName ?? "Unknown",
                    MaskedMobile = MaskPhone(g.CitizenMobileNo),
                    MaskedAadhar = MaskAadhar(g.CitizenAadharNo),
                    BeneficiaryDistrict = g.BeneficiaryDistrict,
                    HospitalName = g.HospitalName,
                    GrievanceCategory = g.GrievanceCategory,
                    GrievanceType = g.GrievanceType,
                    OfficerName = g.OfficerName,
                    OfficerLevel = g.OfficerLevel,
                    AgeInDays = g.AgeInDays,
                    AgeBucket = g.AgeBucket,
                    IsRiskFlagged = g.IsRiskFlagged,
                    RiskCategory = g.RiskCategory
                })
                .ToListAsync();

            return new PagedResultDto<GrievanceGridItemDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<GrievanceDetailDto?> GetGrievanceByIdAsync(long id)
        {
            var g = await _context.Grievances
                .Include(x => x.StatusHistory)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (g == null) return null;
            return MapToDetailDto(g);
        }

        public async Task<GrievanceDetailDto?> GetGrievanceByCompIdAsync(long compId)
        {
            var g = await _context.Grievances
                .Include(x => x.StatusHistory)
                .FirstOrDefaultAsync(x => x.CompId == compId);

            if (g == null) return null;
            return MapToDetailDto(g);
        }

        private static GrievanceDetailDto MapToDetailDto(Grievance g)
        {
            return new GrievanceDetailDto
            {
                Id = g.Id,
                CompId = g.CompId,
                CompType = g.CompType,
                CompDate = g.CompDate.ToString("yyyy-MM-dd"),
                CompTime = g.CompTime,
                Status = g.Status,
                Priority = g.Priority,
                DateOfIncident = g.DateOfIncident?.ToString("yyyy-MM-dd"),
                CitizenName = g.CitizenName ?? "Unknown",
                MaskedMobile = MaskPhone(g.CitizenMobileNo),
                MaskedAadhar = MaskAadhar(g.CitizenAadharNo),
                CitizenEmailId = g.CitizenEmailId,
                CitizenDOB = g.CitizenDOB,
                CitizenGender = g.CitizenGender,
                CaseNo = g.CaseNo,
                PMJAYId = g.PMJAYId,
                ComplaintFor = g.ComplaintFor,
                Department = g.Department,
                BeneficiaryState = g.BeneficiaryState,
                BeneficiaryDistrict = g.BeneficiaryDistrict,
                HospitalName = g.HospitalName,
                HospitalState = g.HospitalState,
                HospitalDistrict = g.HospitalDistrict,
                Address = g.Address,
                GrievanceCategory = g.GrievanceCategory,
                GrievanceType = g.GrievanceType,
                CompRemarks = g.CompRemarks,
                CSolution = g.CSolution,
                ResolutionDate = g.ResolutionDate?.ToString("yyyy-MM-dd"),
                ResolutionTime = g.ResolutionTime,
                OfficerName = g.OfficerName,
                OfficerLevel = g.OfficerLevel,
                OfficerRemarks = g.OfficerRemarks,
                AgeInDays = g.AgeInDays,
                AgeBucket = g.AgeBucket,
                IsRiskFlagged = g.IsRiskFlagged,
                RiskCategory = g.RiskCategory,
                RiskReason = g.RiskReason,
                CreatedAt = g.CreatedAt,
                UpdatedAt = g.UpdatedAt,
                StatusHistory = g.StatusHistory
                    .OrderByDescending(h => h.ChangedAt)
                    .Select(h => new GrievanceStatusHistoryDto
                    {
                        Id = h.Id,
                        PreviousStatus = h.PreviousStatus,
                        NewStatus = h.NewStatus,
                        PreviousOfficer = h.PreviousOfficer,
                        NewOfficer = h.NewOfficer,
                        Remarks = h.Remarks,
                        ChangedAt = h.ChangedAt
                    })
                    .ToList()
            };
        }

        private static string MaskPhone(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone) || phone.Length < 6) return phone ?? "N/A";
            return phone.Substring(0, 2) + "******" + phone.Substring(phone.Length - 2);
        }

        private static string MaskAadhar(string? aadhar)
        {
            if (string.IsNullOrWhiteSpace(aadhar) || aadhar.Length < 4) return "N/A";
            return "XXXX-XXXX-" + aadhar.Substring(aadhar.Length - 4);
        }
    }
}
