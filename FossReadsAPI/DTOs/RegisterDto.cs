using System.ComponentModel.DataAnnotations;

namespace FossReadsAPI.DTOs;

public class RegisterDto
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}