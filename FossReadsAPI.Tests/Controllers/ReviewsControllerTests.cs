using Microsoft.AspNetCore.Mvc;
using FossReadsAPI.Controllers;
using FossReadsAPI.Data;
using FossReadsAPI.DTOs;
using FossReadsAPI.Entities;
using FossReadsAPI.Tests.Helpers;

namespace FossReadsAPI.Tests.Controllers;

public class ReviewsControllerTests
{
    // ------------------------------------------------------------------ helpers

    private static ReviewsController CreateController(AppDbContext context, int userId = 1)
    {
        var controller = new ReviewsController(context);
        ControllerTestHelper.SetUser(controller, userId);
        return controller;
    }

    // ------------------------------------------------------------------ CreateReview

    [Fact]
    public async Task CreateReview_ReturnsCreated_WithValidData()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Books.Add(new Book
        {
            Id = 1, Title = "Dune", Author = "Herbert",
            PublishedYear = 1965, UserId = 1
        });
        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1);
        var dto = new CreateReviewDto { BookId = 1, Title = "Masterpiece", Stars = 5, Description = "Loved it" };

        var result = await controller.CreateReview(dto);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var review = Assert.IsType<Review>(created.Value);
        Assert.Equal(5, review.Stars);
        Assert.Equal("Masterpiece", review.Title);
        Assert.Equal(1, review.UserId);
    }

    [Fact]
    public async Task CreateReview_ReturnsBadRequest_WhenBookAlreadyHasReview()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Books.Add(new Book
        {
            Id = 1, Title = "Dune", Author = "Herbert",
            PublishedYear = 1965, UserId = 1
        });
        context.Reviews.Add(new Review
        {
            Id = 1, Title = "First review", Stars = 4,
            CreatedAt = DateTime.UtcNow, UserId = 1, BookId = 1
        });
        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1);
        var dto = new CreateReviewDto { BookId = 1, Title = "Duplicate review", Stars = 3 };

        var result = await controller.CreateReview(dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Book already has a review", badRequest.Value);
    }

    [Fact]
    public async Task CreateReview_ReturnsForbid_WhenBookBelongsToDifferentUser()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Books.Add(new Book
        {
            Id = 1, Title = "Dune", Author = "Herbert",
            PublishedYear = 1965, UserId = 2   // owned by user 2
        });
        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1); // logged in as user 1

        var dto = new CreateReviewDto { BookId = 1, Title = "Sneaky review", Stars = 1 };

        var result = await controller.CreateReview(dto);

        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task CreateReview_ReturnsNotFound_WhenBookDoesNotExist()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        var controller = CreateController(context, userId: 1);

        var dto = new CreateReviewDto { BookId = 999, Title = "Ghost review", Stars = 3 };

        var result = await controller.CreateReview(dto);

        var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Equal("Book not found", notFound.Value);
    }

    // ------------------------------------------------------------------ UpdateReview

    [Fact]
    public async Task UpdateReview_ReturnsForbid_WhenUserDoesNotOwnReview()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Reviews.Add(new Review
        {
            Id = 1, Title = "Review", Stars = 3,
            CreatedAt = DateTime.UtcNow, UserId = 2, BookId = 1  // owned by user 2
        });
        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1);
        var dto = new UpdateReviewDto { Title = "Tampered", Stars = 1 };

        var result = await controller.UpdateReview(1, dto);

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task UpdateReview_ReturnsNotFound_WhenReviewDoesNotExist()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        var controller = CreateController(context, userId: 1);

        var dto = new UpdateReviewDto { Title = "Ghost", Stars = 3 };

        var result = await controller.UpdateReview(999, dto);

        Assert.IsType<NotFoundResult>(result);
    }

    // ------------------------------------------------------------------ DeleteReview

    [Fact]
    public async Task DeleteReview_ReturnsForbid_WhenUserDoesNotOwnReview()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Reviews.Add(new Review
        {
            Id = 1, Title = "Review", Stars = 3,
            CreatedAt = DateTime.UtcNow, UserId = 2, BookId = 1
        });
        await context.SaveChangesAsync();

        var controller = CreateController(context, userId: 1);

        var result = await controller.DeleteReview(1);

        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task DeleteReview_ReturnsNotFound_WhenReviewDoesNotExist()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        var controller = CreateController(context, userId: 1);

        var result = await controller.DeleteReview(999);

        Assert.IsType<NotFoundResult>(result);
    }
}
