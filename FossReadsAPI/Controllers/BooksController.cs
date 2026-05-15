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
public class BooksController : ControllerBase
{
    private readonly AppDbContext _context;

    public BooksController(AppDbContext context)
    {
        _context = context;
    }

    // POST: api/books
 [Authorize]
[HttpPost]
public async Task<ActionResult<Book>> CreateBook(CreateBookDto dto)
{
    var userId = GetUserId();

    var book = new Book
    {
        Title = dto.Title,
        Author = dto.Author,
        Description = dto.Description,
        PublishedYear = dto.PublishedYear,
        Status = dto.Status,
        ReadDate = dto.Status == ReadingStatus.Read ? DateTime.UtcNow : null,
        Ownership = dto.Ownership,
        UserId = userId
    };

    _context.Books.Add(book);
    await _context.SaveChangesAsync();

    return CreatedAtAction(nameof(GetBookById), new { id = book.Id }, book);
}

    // GET: api/books/{id}
          //In theory this allows users to fetch other users’ reviews
        // but users can only see their own books
    [HttpGet("{id}")]
    public async Task<ActionResult<Book>> GetBookById(int id)
    {
        //var book = await _context.Books.FindAsync(id);

        var book = await _context.Books
    .Include(b => b.Review)
    .FirstOrDefaultAsync(b => b.Id == id);

        if (book == null)
            return NotFound();

        return Ok(book);
    }

    [Authorize]
    [HttpGet("read")]
    public async Task<ActionResult<PagedResult<Book>>> GetReadBooks(int page = 1, int pageSize = 10)
    {
        var userId = GetUserId();

        var query = _context.Books
            .Where(b => b.UserId == userId && b.Status == ReadingStatus.Read)
            .Include(b => b.Review);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var books = await query
            .OrderByDescending(b => b.ReadDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new PagedResult<Book>
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            Items = books
        });
    }

    [Authorize]
    [HttpGet]
    public async Task<ActionResult<PagedResult<Book>>> GetBooks(int page = 1, int pageSize = 10)
    {
        var userId = GetUserId();

        /*
        var query = _context.Books
            .Where(b => b.UserId == userId); //Filter books to users
        */

        var query = _context.Books
        .Where(b => b.UserId == userId)
        .Include(b => b.Review);

        var totalCount = await query.CountAsync();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var books = await query
            .OrderByDescending(b => b.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new PagedResult<Book>
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            Items = books
        });
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBook(int id, UpdateBookDto dto)
    {
        var userId = GetUserId();

        //var book = await _context.Books.FindAsync(id);

        var book = await _context.Books
    .Include(b => b.Review)
    .FirstOrDefaultAsync(b => b.Id == id);

        if (book == null)
            return NotFound();

        if (book.UserId != userId) // check for ownership
            return Forbid();

        book.Title = dto.Title;
        book.Author = dto.Author;
        book.Description = dto.Description;
        book.PublishedYear = dto.PublishedYear;
        book.Status = dto.Status;
        book.Ownership = dto.Ownership;
        if (dto.Status == ReadingStatus.Read && book.ReadDate == null)
            book.ReadDate = DateTime.UtcNow;
        else if (dto.Status != ReadingStatus.Read)
            book.ReadDate = null;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBook(int id)
    {
        var userId = GetUserId();

        //var book = await _context.Books.FindAsync(id);

        var book = await _context.Books
    .Include(b => b.Review)
    .FirstOrDefaultAsync(b => b.Id == id);

        if (book == null)
            return NotFound();

        if (book.UserId != userId) // check for ownership
            return Forbid();

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize]
    [HttpPost("{id}/image")]
    public async Task<IActionResult> UploadImage(int id, IFormFile image, IWebHostEnvironment env)
    {
        var userId = GetUserId();
        var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == id);

        if (book == null) return NotFound();
        if (book.UserId != userId) return Forbid();

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(image.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            return BadRequest("Only jpg, jpeg, png, and webp images are allowed.");

        if (image.Length > 5 * 1024 * 1024)
            return BadRequest("Image must be under 5 MB.");

        var imagesDir = Path.Combine(env.WebRootPath, "images", "books");
        Directory.CreateDirectory(imagesDir);

        if (book.ImagePath != null)
        {
            var oldFile = Path.Combine(env.WebRootPath, book.ImagePath.TrimStart('/'));
            if (System.IO.File.Exists(oldFile))
                System.IO.File.Delete(oldFile);
        }

        var fileName = $"{id}_{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(imagesDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
            await image.CopyToAsync(stream);

        book.ImagePath = $"/images/books/{fileName}";
        await _context.SaveChangesAsync();

        return Ok(new { imagePath = book.ImagePath });
    }

    [Authorize]
    [HttpDelete("{id}/image")]
    public async Task<IActionResult> DeleteImage(int id, IWebHostEnvironment env)
    {
        var userId = GetUserId();
        var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == id);

        if (book == null) return NotFound();
        if (book.UserId != userId) return Forbid();

        if (book.ImagePath != null)
        {
            var oldFile = Path.Combine(env.WebRootPath, book.ImagePath.TrimStart('/'));
            if (System.IO.File.Exists(oldFile))
                System.IO.File.Delete(oldFile);
            book.ImagePath = null;
            await _context.SaveChangesAsync();
        }

        return NoContent();
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    }

}