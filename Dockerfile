# ==========================================
# ЭТАП 1: Сборка фронтенда (React/Vite)
# ==========================================
FROM node:20-alpine AS build-frontend
WORKDIR /frontend

# Копируем package.json и устанавливаем пакеты
COPY frontend/package*.json ./
RUN npm install

# Копируем остальные исходники фронтенда и собираем билд
COPY frontend/ ./
RUN npm run build 
# Итог сборки появится внутри контейнера в /frontend/dist

# ==========================================
# ЭТАП 2: Базовый образ .NET
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /XPEHb
EXPOSE 8080 

# ==========================================
# ЭТАП 3: Сборка бэкенда (.NET)
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["XPEHb.csproj", "./"]
RUN dotnet restore "./XPEHb.csproj"
COPY . .
RUN dotnet build "XPEHb.csproj" -c Release -o /XPEHb/build

# ==========================================
# ЭТАП 4: Публикация бэкенда
# ==========================================
FROM build AS publish
RUN dotnet publish "XPEHb.csproj" -c Release -o /XPEHb/publish

# ==========================================
# ФИНАЛ: Объединяем Бэкенд и Фронтенд
# ==========================================
FROM base AS final
WORKDIR /XPEHb

# 1. Закидываем готовый бэкенд
COPY --from=publish /XPEHb/publish .

# 2. Переносим старые файлы из вашей текущей статики (если у вас там что-то осталось)
# COPY src/wwwroot ./wwwroot  <-- Закомментировано, чтобы не затереть

# 3. Копируем готовый (скомпилированный) React-фронтенд в wwwroot
COPY --from=build-frontend /frontend/dist ./wwwroot

ENTRYPOINT ["dotnet", "XPEHb.dll"]