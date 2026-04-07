    FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
    WORKDIR /XPEHb

    EXPOSE 8080 

    FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
    WORKDIR /src
    COPY ["XPEHb.csproj", "./"]
    RUN dotnet restore "./XPEHb.csproj"
    COPY . .

    RUN dotnet build "XPEHb.csproj" -c Release -o /XPEHb/build

    FROM build AS publish
    RUN dotnet publish "XPEHb.csproj" -c Release -o /XPEHb/publish

    FROM base AS final
    WORKDIR /XPEHb
    COPY --from=publish /XPEHb/publish .
    COPY index.html ./
    ENTRYPOINT ["dotnet", "XPEHb.dll"]