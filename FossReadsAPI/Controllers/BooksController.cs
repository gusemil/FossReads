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

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    }

}