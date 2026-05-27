# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Use the full SDK image so we can compile and publish the app.
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy the project file first and restore dependencies.
# Doing this as a separate layer means Docker can cache the restore step
# and skip it on future builds when only source code changes.
COPY FossReadsAPI.csproj .
RUN dotnet restore

# Copy the rest of the source and publish a Release build.
COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
# Use the smaller ASP.NET runtime image — no SDK tools, just what's needed to run.
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# ASP.NET Core listens on port 8080 by default in containers.
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "FossReadsAPI.dll"]
