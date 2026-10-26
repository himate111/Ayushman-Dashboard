using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BeneficiaryGrievance.Api.DTOs;
using BeneficiaryGrievance.Api.Models;

namespace BeneficiaryGrievance.Api.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> AuthenticateAsync(LoginRequestDto request);
        Task<List<UserDto>> GetUsersAsync();
        Task<UserDto?> CreateUserAsync(UserDto request, string password);
        string HashPassword(string password);
    }
}
