using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FossReadsAPI.Data;
using FossReadsAPI.Entities;
using FossReadsAPI.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace FossReadsAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReviewsController(AppDbContext context)
    {
        _context = context;
    }

    // POST: api/reviews
[Authorize]
[HttpPost]
public async Task<ActionResult<Review>> CreateReview(CreateReviewDto dto)
{
    var userId = GetUserId();

    // 1. Check book exists
    var book = await _context.Books
        .Include(b => b.Review)
        .FirstOrDefaultAsync(b => b.Id == dto.BookId);

    if (book == null)
        return NotFound("Book not found");

    // 2. Ensure ownership
    if (book.UserId != userId)
        return Forbid();

    // 3. Enforce ONE review per book
    if (book.Review != null)
        return BadRequest("Book already has a review");

    var review = new Review
    {
        Title = dto.Title,
        Description = dto.Description,
        Stars = dto.Stars,
        CreatedAt = DateTime.UtcNow,
        UserId = userId,
        BookId = dto.BookId
    };

    _context.Reviews.Add(review);
    await _context.SaveChangesAsync();

    return CreatedAtAction(nameof(GetReviewById), new { id = review.Id }, review);
}

    // GET: api/reviews/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Review>> GetReviewById(int id)
    {
        //In theory this allows users to fetch other users’ reviews
        // but users can only see their own books
        var review = await _context.Reviews.FindAsync(id);

        if (review == null)
            return NotFound();

        return Ok(review);
    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<PagedResult<Review>>> GetReviews(int page = 1, int pageSize = 10)
    {
        var userId = GetUserId();

        var query = _context.Reviews
            .Where(b => b.UserId == userId); //Filter reviews to users

        var totalCount = await query.CountAsync();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var reviews = await query
            .OrderByDescending(b => b.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new PagedResult<Review>
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            Items = reviews
        });
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateReview(int id, UpdateReviewDto dto)
    {
        var userId = GetUserId();

        var review = await _context.Reviews.FindAsync(id);

        if (review == null)
            return NotFound();

        if (review.UserId != userId) // check for ownership
            return Forbid();

        review.Title = dto.Title;
        review.Description = dto.Description;
        review.Stars = dto.Stars;
        review.CreatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReview(int id)
    {
        var userId = GetUserId();

        var review = await _context.Reviews.FindAsync(id);

        if (review == null)
            return NotFound();

        if (review.UserId != userId) // check for ownership
            return Forbid();

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    }

}