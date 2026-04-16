using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FossReadsAPI.Data;
using FossReadsAPI.Entities;
using FossReadsAPI.DTOs;
using Microsoft.AspNetCore.Authorization;

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
        var book = new Book
        {
            Title = dto.Title,
            Author = dto.Author,
            Description = dto.Description,
            PublishedYear = dto.PublishedYear
        };

        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetBookById),
            new { id = book.Id },
            book
        );
    }

    // GET: api/books/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Book>> GetBookById(int id)
    {
        var book = await _context.Books.FindAsync(id);

        if (book == null)
            return NotFound();

        return Ok(book);
    }

        [HttpGet]
    public async Task<ActionResult<PagedResult<Book>>> GetBooks(
        int page = 1,
        int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100; // safety limit

        var query = _context.Books.AsQueryable();

        var totalCount = await query.CountAsync();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var books = await query
            .OrderByDescending(b => b.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = new PagedResult<Book>
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            Items = books
        };

        return Ok(result);
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBook(int id, UpdateBookDto dto)
    {
        var book = await _context.Books.FindAsync(id);

        if (book == null)
            return NotFound();

        book.Title = dto.Title;
        book.Author = dto.Author;
        book.Description = dto.Description;
        book.PublishedYear = dto.PublishedYear;

        await _context.SaveChangesAsync();

        return NoContent(); //Because we return nothing, only update

    }

        [Authorize]
        [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBook(int id)
    {
        var book = await _context.Books.FindAsync(id);

        if (book == null)
            return NotFound();

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();

        return NoContent();
    }

}