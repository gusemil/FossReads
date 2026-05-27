using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FossReadsAPI.Data;

namespace FossReadsAPI.Tests.Helpers;

/// <summary>
/// Shared helpers for controller unit tests.
/// </summary>
public static class ControllerTestHelper
{
    /// <summary>
    /// Creates a fresh in-memory AppDbContext with a unique database name so
    /// each test is fully isolated from every other test.
    /// </summary>
    public static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    /// <summary>
    /// Sets a fake authenticated user on the controller's HttpContext so that
    /// controller methods that call GetUserId() / User.FindFirst(...) work
    /// without running the real JWT middleware.
    /// </summary>
    public static void SetUser(ControllerBase controller, int userId, string username = "testuser")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username)
        };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }
}
