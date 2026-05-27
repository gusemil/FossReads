using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using FossReadsAPI.Controllers;
using FossReadsAPI.Data;
using FossReadsAPI.DTOs;
using FossReadsAPI.Entities;
using FossReadsAPI.Tests.Helpers;

namespace FossReadsAPI.Tests.Controllers;

public class AuthControllerTests
{
    // ------------------------------------------------------------------ helpers

    /// <summary>
    /// Provides a minimal IConfiguration with valid JWT settings so that
    /// AuthController.CreateToken() can sign tokens during tests.
    /// </summary>
    private static IConfiguration CreateTestConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"]    = "TestSecretKeyThatIsLongEnoughForHmacSha256!",
                ["Jwt:Issuer"] = "TestIssuer"
            })
            .Build();

    private static AuthController CreateController(AppDbContext context) =>
        new AuthController(context, CreateTestConfig());

    // ------------------------------------------------------------------ Register

    [Fact]
    public async Task Register_ReturnsOk_ForNewUser()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        var controller = CreateController(context);

        var dto = new RegisterDto { Username = "alice", Password = "s3cr3t!" };

        var result = await controller.Register(dto);

        Assert.IsType<OkResult>(result);
        Assert.Single(context.Users);
        Assert.Equal("alice", context.Users.First().Username);
    }

    [Fact]
    public async Task Register_ReturnsBadRequest_WhenUsernameAlreadyExists()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Users.Add(new User { Username = "alice", PasswordHash = "hash" });
        await context.SaveChangesAsync();

        var controller = CreateController(context);
        var dto = new RegisterDto { Username = "alice", Password = "s3cr3t!" };

        var result = await controller.Register(dto);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal("User already exists", badRequest.Value);
    }

    [Fact]
    public async Task Register_StoresHashedPassword_NotPlainText()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        var controller = CreateController(context);

        var dto = new RegisterDto { Username = "bob", Password = "mypassword" };

        await controller.Register(dto);

        var user = context.Users.First();
        Assert.NotEqual("mypassword", user.PasswordHash);
        // BCrypt hashes always start with $2
        Assert.StartsWith("$2", user.PasswordHash);
    }

    // ------------------------------------------------------------------ Login

    [Fact]
    public void Login_ReturnsTokenObject_WithValidCredentials()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Users.Add(new User
        {
            Username = "alice",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("s3cr3t!")
        });
        context.SaveChanges();

        var controller = CreateController(context);
        var dto = new LoginDto { Username = "alice", Password = "s3cr3t!" };

        var result = controller.Login(dto);

        var ok = Assert.IsType<OkObjectResult>(result);
        // Response is anonymous { token = "..." } — access via reflection
        var token = ok.Value!.GetType().GetProperty("token")!.GetValue(ok.Value) as string;
        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }

    [Fact]
    public void Login_ReturnsUnauthorized_WithWrongPassword()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        context.Users.Add(new User
        {
            Username = "alice",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correctpassword")
        });
        context.SaveChanges();

        var controller = CreateController(context);
        var dto = new LoginDto { Username = "alice", Password = "wrongpassword" };

        var result = controller.Login(dto);

        Assert.IsType<UnauthorizedResult>(result);
    }

    [Fact]
    public void Login_ReturnsUnauthorized_WhenUserDoesNotExist()
    {
        using var context = ControllerTestHelper.CreateInMemoryContext();
        var controller = CreateController(context);

        var dto = new LoginDto { Username = "nobody", Password = "password" };

        var result = controller.Login(dto);

        Assert.IsType<UnauthorizedResult>(result);
    }
}
