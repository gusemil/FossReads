using System.ComponentModel.DataAnnotations;
using FossReadsAPI.Entities;

public class Review
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Range(1, 5)] public int Stars {get; set;}
    public DateTime CreatedAt { get; set; }

    public int UserId { get; set; } //FK
    public User User { get; set; } = null!;
    public int BookId { get; set; } //FK
    public Book Book { get; set; } = null!;
}