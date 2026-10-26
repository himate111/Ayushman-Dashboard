using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BeneficiaryGrievance.Api.DTOs;
using BeneficiaryGrievance.Api.Services;

namespace BeneficiaryGrievance.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var result = await _authService.AuthenticateAsync(request);
            if (result == null)
            {
                return Unauthorized(new { message = "Invalid username or password." });
            }
            return Ok(result);
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _authService.GetUsersAsync();
            return Ok(users);
        }
    }
}
