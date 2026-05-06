using System.ComponentModel.DataAnnotations;

namespace FossReadsAPI.DTOs;

public class UpdateReviewDto
{
    [Required]
    [MaxLength(50)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [Range(1, 5)] 
    public int Stars {get; set;}
}