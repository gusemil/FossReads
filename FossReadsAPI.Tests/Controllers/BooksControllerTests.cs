using Microsoft.AspNetCore.Mvc;
using FossReadsAPI.Controllers;
using FossReadsAPI.Data;
using FossReadsAPI.DTOs;
using FossReadsAPI.Entities;
using FossReadsAPI.Tests.Helpers;

namespace FossReadsAPI.Tests.Controllers;

public class BooksControllerTests
{
    // ------------------------------------------------------------------ helpers

    private static BooksController CreateController(AppDbContext context, int userId = 1)
    {
        var controller = new BooksController(context);
        ControllerTestHelper.SetUser(controller, userId);
        return controller;
    }

    // ------------------------------------------------------------------ CreateBook

    [Fact]
    public async Task CreateBook_ReturnsCreatedResult_WithCorrectData()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        var controller = CreateController(context, userId: 1);

        var dto = new CreateBookDto
        {
            Title = "Clean Code",
            Author = "Robert C. Martin",
            PublishedYear = 2008,
            Status = ReadingStatus.NoProgress
        };

        var result = await controller.CreateBook(dto);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var book = Assert.IsType<Book>(created.Value);
        Assert.Equal("Clean Code", book.Title);
        Assert.Equal(1, book.UserId);
    }

    [Fact]
    public async Task CreateBook_SetsReadDate_WhenStatusIsRead()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        var controller = CreateController(context);

        var dto = new CreateBookDto
        {
            Title = "The Pragmatic Programmer",
            Author = "Hunt & Thomas",
            PublishedYear = 1999,
            Status = ReadingStatus.Read
        };

        var result = await controller.CreateBook(dto);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var book = Assert.IsType<Book>(created.Value);
        Assert.NotNull(book.ReadDate);
    }

    [Fact]
    public async Task CreateBook_DoesNotSetReadDate_WhenStatusIsNotRead()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        var controller = CreateController(context);

        var dto = new CreateBookDto
        {
            Title = "Refactoring",
            Author = "Martin Fowler",
            PublishedYear = 1999,
            Status = ReadingStatus.InProgress
        };

        var result = await controller.CreateBook(dto);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var book = Assert.IsType<Book>(created.Value);
        Assert.Null(book.ReadDate);
    }

    // ------------------------------------------------------------------ UpdateBook

    [Fact]
    public async Task UpdateBook_ReturnsForbid_WhenUserDoesNotOwnBook()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Books.Add(new Book
        {
            Id = 1, Title = "Someone Else's Book", Author = "Other",
            PublishedYear = 2020, UserId = 2   // owned by user 2
        });
        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1); // logged in as user 1

        var dto = new UpdateBookDto
        {
            Title = "Hacked Title", Author = "Hacker",
            PublishedYear = 2020, Status = ReadingStatus.NoProgress
        };

        var result = await controller.UpdateBook(1, dto);

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task UpdateBook_SetsReadDate_WhenStatusChangedToRead()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Books.Add(new Book
        {
            Id = 1, Title = "Book", Author = "Author",
            PublishedYear = 2020, UserId = 1, Status = ReadingStatus.InProgress
        });
        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1);
        var dto = new UpdateBookDto
        {
            Title = "Book", Author = "Author",
            PublishedYear = 2020, Status = ReadingStatus.Read
        };

        await controller.UpdateBook(1, dto);

        var book = await context.Books.FindAsync(1);
        Assert.NotNull(book!.ReadDate);
    }

    [Fact]
    public async Task UpdateBook_ClearsReadDate_WhenStatusChangedFromRead()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Books.Add(new Book
        {
            Id = 1, Title = "Book", Author = "Author",
            PublishedYear = 2020, UserId = 1,
            Status = ReadingStatus.Read, ReadDate = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1);
        var dto = new UpdateBookDto
        {
            Title = "Book", Author = "Author",
            PublishedYear = 2020, Status = ReadingStatus.DidNotFinish
        };

        await controller.UpdateBook(1, dto);

        var book = await context.Books.FindAsync(1);
        Assert.Null(book!.ReadDate);
    }

    [Fact]
    public async Task UpdateBook_ReturnsNotFound_WhenBookDoesNotExist()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        var controller = CreateController(context, userId: 1);

        var dto = new UpdateBookDto
        {
            Title = "Ghost", Author = "Nobody",
            PublishedYear = 2020, Status = ReadingStatus.NoProgress
        };

        var result = await controller.UpdateBook(999, dto);

        Assert.IsType<NotFoundResult>(result);
    }

    // ------------------------------------------------------------------ DeleteBook

    [Fact]
    public async Task DeleteBook_ReturnsForbid_WhenUserDoesNotOwnBook()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Books.Add(new Book
        {
            Id = 1, Title = "Not My Book", Author = "Other",
            PublishedYear = 2020, UserId = 2
        });
        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1);

        var result = await controller.DeleteBook(1);

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task DeleteBook_ReturnsNotFound_WhenBookDoesNotExist()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        var controller = CreateController(context, userId: 1);

        var result = await controller.DeleteBook(999);

        Assert.IsType<NotFoundResult>(result);
    }

    // ------------------------------------------------------------------ GetBooks

    [Fact]
    public async Task GetBooks_ReturnsOnlyCurrentUsersBooks()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Books.AddRange(
            new Book { Title = "My Book",    Author = "Me",    PublishedYear = 2020, UserId = 1 },
            new Book { Title = "Other Book", Author = "Other", PublishedYear = 2020, UserId = 2 }
        );
        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1);

        var result = await controller.GetBooks();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<Book>>(ok.Value);
        Assert.Single(paged.Items);
        Assert.Equal("My Book", paged.Items[0].Title);
    }

    [Fact]
    public async Task GetBooks_ReturnsCorrectPaginationMetadata()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        for (int i = 1; i <= 15; i++)
            context.Books.Add(new Book { Title = $"Book {i}", Author = "Author", PublishedYear = 2020, UserId = 1 });
        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1);

        var result = await controller.GetBooks(page: 1, pageSize: 10);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<Book>>(ok.Value);
        Assert.Equal(10, paged.Items.Count);
        Assert.Equal(15, paged.TotalCount);
        Assert.Equal(2, paged.TotalPages);
        Assert.Equal(1, paged.Page);
    }

    // ------------------------------------------------------------------ GetReadBooks

    [Fact]
    public async Task GetReadBooks_ReturnsOnlyBooksWithReadStatus()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Books.AddRange(
            new Book { Title = "Finished",   Author = "A", PublishedYear = 2020, UserId = 1, Status = ReadingStatus.Read,       ReadDate = DateTime.UtcNow },
            new Book { Title = "Still Going", Author = "B", PublishedYear = 2020, UserId = 1, Status = ReadingStatus.InProgress }
        );
        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1);

        var result = await controller.GetReadBooks();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var paged = Assert.IsType<PagedResult<Book>>(ok.Value);
        Assert.Single(paged.Items);
        Assert.Equal("Finished", paged.Items[0].Title);
    }
}
