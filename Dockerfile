FROM node:20-alpine AS build-frontend
WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build 
# Итог сборки появится внутри контейнера в /frontend/dist


FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /XPEHb
EXPOSE 8080 


FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
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

COPY --from=build-frontend /frontend/dist ./wwwroot

ENTRYPOINT ["dotnet", "XPEHb.dll"]