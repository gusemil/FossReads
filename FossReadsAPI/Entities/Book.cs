using FossReadsAPI.Entities;

public class Book
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int PublishedYear { get; set; }

    public ReadingStatus Status { get; set; } = ReadingStatus.NoProgress;

    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public Review? Review { get; set; } // Every book CAN have one review
}