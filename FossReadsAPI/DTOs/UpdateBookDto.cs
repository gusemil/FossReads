using System.ComponentModel.DataAnnotations;

namespace FossReadsAPI.DTOs;

public class UpdateBookDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Author { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Range(0, 2100)]
    public int PublishedYear { get; set; }
}