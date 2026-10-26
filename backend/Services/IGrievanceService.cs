using BeneficiaryGrievance.Api.DTOs;

namespace BeneficiaryGrievance.Api.Services
{
    public interface IGrievanceService
    {
        Task<PagedResultDto<GrievanceGridItemDto>> GetGrievancesPagedAsync(GrievanceQueryDto query);
        Task<GrievanceDetailDto?> GetGrievanceByIdAsync(long id);
        Task<GrievanceDetailDto?> GetGrievanceByCompIdAsync(long compId);
    }
}
