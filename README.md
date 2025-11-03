# Restaurant Analytics

Sistema completo de análise de dados para restaurantes, fornecendo insights sobre vendas, desempenho de produtos, comportamento de clientes e eficiência operacional.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API Endpoints](#api-endpoints)
- [Modelos de Dados](#modelos-de-dados)
- [Testes](#testes)
- [Deploy](#deploy)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🎯 Visão Geral

O Restaurant Analytics é uma plataforma de business intelligence desenvolvida para ajudar restaurantes a tomarem decisões baseadas em dados. O sistema processa informações de vendas, cardápio e operações para gerar relatórios e dashboards interativos.

### Principais Benefícios

- **Análise de Vendas**: Acompanhamento de receitas, tickets médios e tendências
- **Performance de Produtos**: Identificação dos itens mais rentáveis
- **Insights de Clientes**: Análise de comportamento e preferências
- **Eficiência Operacional**: Otimização de processos e recursos
- **Previsão de Demanda**: Machine learning para previsões de vendas

## ✨ Funcionalidades

### Dashboard Executivo
- Métricas em tempo real (vendas diárias, ticket médio, total de pedidos)
- Gráficos de tendências de vendas
- Top produtos por receita e quantidade
- Análise de horários de pico

### Análise de Produtos
- Ranking de produtos por vendas
- Margem de contribuição por item
- Análise de categorias
- Produtos com baixo desempenho

### Análise de Clientes
- Segmentação de clientes (frequência e valor)
- Análise RFM (Recency, Frequency, Monetary)
- Padrões de consumo
- Taxa de retenção

### Relatórios Avançados
- Análise de sazonalidade
- Previsão de demanda (ML)
- Análise de correlação entre produtos
- Exportação de dados (CSV, PDF, Excel)

## 🏗️ Arquitetura

O sistema segue uma arquitetura em camadas (layered architecture) com separação clara de responsabilidades:

```
┌─────────────────────────────────────────┐
│         Frontend (React/Vue)            │
│    - Dashboards interativos             │
│    - Visualizações de dados             │
└─────────────────┬───────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────┐
│         API Layer (Flask)               │
│    - Endpoints RESTful                  │
│    - Autenticação/Autorização           │
│    - Validação de dados                 │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Business Logic Layer              │
│    - Serviços de negócio                │
│    - Regras de cálculo                  │
│    - Processamento de dados             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Data Access Layer (ORM)           │
│    - Modelos SQLAlchemy                 │
│    - Repositories                       │
│    - Queries otimizadas                 │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│     Database (PostgreSQL/MySQL)         │
│    - Dados transacionais                │
│    - Dados históricos                   │
└─────────────────────────────────────────┘
```

### Componentes Principais

1. **API REST**: Flask + Flask-RESTX para documentação automática (Swagger)
2. **ORM**: SQLAlchemy para abstração de banco de dados
3. **Cache**: Redis para otimização de queries frequentes
4. **Task Queue**: Celery para processamento assíncrono
5. **ML Engine**: Scikit-learn para modelos preditivos

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.9+**
- **Flask** - Framework web
- **Flask-RESTX** - API REST + Swagger
- **SQLAlchemy** - ORM
- **Pandas** - Análise de dados
- **NumPy** - Computação numérica
- **Scikit-learn** - Machine learning
- **Celery** - Task queue
- **Redis** - Cache e message broker

### Frontend (opcional)
- **React/Vue.js** - Interface
- **Chart.js/D3.js** - Visualizações
- **Material-UI/Ant Design** - Componentes

### Database
- **PostgreSQL** (recomendado) ou **MySQL**
- **Redis** - Cache

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração local
- **Nginx** - Reverse proxy
- **Gunicorn** - WSGI server

## 📦 Pré-requisitos

- Python 3.9 ou superior
- PostgreSQL 12+ ou MySQL 8+
- Redis 6+
- Docker e Docker Compose (opcional)
- Node.js 14+ (se usar frontend)

## 🚀 Instalação

### Instalação Local

1. **Clone o repositório**
```bash
git clone https://github.com/solerpedroo/restaurant-analytics.git
cd restaurant-analytics
```

2. **Crie um ambiente virtual**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

3. **Instale as dependências**
```bash
pip install -r requirements.txt
```

4. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

5. **Inicialize o banco de dados**
```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

6. **Carregue dados de exemplo (opcional)**
```bash
python scripts/seed_data.py
```

### Instalação com Docker

```bash
# Build e start dos containers
docker-compose up -d

# Executar migrações
docker-compose exec web flask db upgrade

# Carregar dados de exemplo
docker-compose exec web python scripts/seed_data.py
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Flask
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=sua-chave-secreta-aqui

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/restaurant_analytics
# ou
DATABASE_URL=mysql://user:password@localhost:3306/restaurant_analytics

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# JWT
JWT_SECRET_KEY=sua-jwt-secret-key
JWT_ACCESS_TOKEN_EXPIRES=3600

# API
API_TITLE=Restaurant Analytics API
API_VERSION=1.0
API_DESCRIPTION=API para análise de dados de restaurantes

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
```

### Configuração do Banco de Dados

**PostgreSQL** (recomendado):
```sql
CREATE DATABASE restaurant_analytics;
CREATE USER analytics_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE restaurant_analytics TO analytics_user;
```

**MySQL**:
```sql
CREATE DATABASE restaurant_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'analytics_user'@'localhost' IDENTIFIED BY 'sua_senha';
GRANT ALL PRIVILEGES ON restaurant_analytics.* TO 'analytics_user'@'localhost';
FLUSH PRIVILEGES;
```

## 📖 Uso

### Iniciar o Servidor

```bash
# Desenvolvimento
flask run

# Produção (com Gunicorn)
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Iniciar Worker Celery

```bash
celery -A app.celery worker --loglevel=info
```

### Acessar a API

- **Swagger UI**: http://localhost:5000/api/docs
- **API Base**: http://localhost:5000/api/v1

### Exemplos de Requisições

**Obter métricas do dashboard**:
```bash
curl -X GET "http://localhost:5000/api/v1/analytics/dashboard?start_date=2024-01-01&end_date=2024-12-31"
```

**Análise de produtos**:
```bash
curl -X GET "http://localhost:5000/api/v1/analytics/products/top?limit=10"
```

**Previsão de vendas**:
```bash
curl -X POST "http://localhost:5000/api/v1/analytics/forecast" \
  -H "Content-Type: application/json" \
  -d '{"days": 7, "product_id": 1}'
```

## 📁 Estrutura do Projeto

```
restaurant-analytics/
├── app/
│   ├── __init__.py
│   ├── models/              # Modelos SQLAlchemy
│   │   ├── __init__.py
│   │   ├── sale.py
│   │   ├── product.py
│   │   └── customer.py
│   ├── services/            # Lógica de negócio
│   │   ├── __init__.py
│   │   ├── analytics_service.py
│   │   ├── forecast_service.py
│   │   └── report_service.py
│   ├── api/                 # Endpoints da API
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── analytics.py
│   │   │   ├── products.py
│   │   │   └── customers.py
│   ├── utils/               # Utilitários
│   │   ├── __init__.py
│   │   ├── decorators.py
│   │   └── validators.py
│   └── config.py            # Configurações
├── migrations/              # Migrações do banco
├── tests/                   # Testes
│   ├── unit/
│   ├── integration/
│   └── conftest.py
├── scripts/                 # Scripts auxiliares
│   ├── seed_data.py
│   └── backup_db.py
├── docs/                    # Documentação
│   ├── architecture.md
│   └── api_guide.md
├── docker/
│   ├── Dockerfile
│   └── nginx.conf
├── .env.example
├── .gitignore
├── docker-compose.yml
├── requirements.txt
├── requirements-dev.txt
├── README.md
└── setup.py
```

## 🔌 API Endpoints

### Analytics

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/analytics/dashboard` | Dashboard principal |
| GET | `/api/v1/analytics/sales` | Análise de vendas |
| GET | `/api/v1/analytics/products/top` | Top produtos |
| GET | `/api/v1/analytics/products/performance` | Performance de produtos |
| GET | `/api/v1/analytics/customers/segmentation` | Segmentação de clientes |
| POST | `/api/v1/analytics/forecast` | Previsão de demanda |
| GET | `/api/v1/analytics/trends` | Análise de tendências |

### Relatórios

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/reports/generate` | Gerar relatório |
| GET | `/api/v1/reports/{id}` | Obter relatório |
| GET | `/api/v1/reports/export/{format}` | Exportar dados |

### Produtos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/products` | Listar produtos |
| GET | `/api/v1/products/{id}` | Detalhes do produto |
| POST | `/api/v1/products` | Criar produto |
| PUT | `/api/v1/products/{id}` | Atualizar produto |
| DELETE | `/api/v1/products/{id}` | Deletar produto |

## 💾 Modelos de Dados

### Sale (Venda)
```python
{
  "id": "uuid",
  "date": "datetime",
  "customer_id": "uuid",
  "total_amount": "decimal",
  "items": [SaleItem],
  "payment_method": "string",
  "status": "string"
}
```

### Product (Produto)
```python
{
  "id": "uuid",
  "name": "string",
  "category": "string",
  "price": "decimal",
  "cost": "decimal",
  "description": "string",
  "is_active": "boolean"
}
```

### Customer (Cliente)
```python
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "phone": "string",
  "total_spent": "decimal",
  "visit_count": "integer",
  "last_visit": "datetime"
}
```

## 🧪 Testes

```bash
# Executar todos os testes
pytest

# Com cobertura
pytest --cov=app tests/

# Testes específicos
pytest tests/unit/test_analytics.py

# Gerar relatório HTML de cobertura
pytest --cov=app --cov-report=html tests/
```

## 🚢 Deploy

### Deploy com Docker

```bash
# Build da imagem
docker build -t restaurant-analytics:latest .

# Push para registry
docker tag restaurant-analytics:latest seu-registry/restaurant-analytics:latest
docker push seu-registry/restaurant-analytics:latest

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Deploy em Cloud (AWS/GCP/Azure)

1. **Configurar variáveis de ambiente**
2. **Configurar banco de dados gerenciado**
3. **Configurar Redis gerenciado**
4. **Deploy da aplicação** (ECS, Cloud Run, App Service)
5. **Configurar load balancer**
6. **Configurar SSL/TLS**
7. **Configurar monitoramento**

### Checklist de Produção

- [ ] Configurar HTTPS
- [ ] Ativar rate limiting
- [ ] Configurar backups automáticos
- [ ] Implementar monitoramento (Prometheus, Grafana)
- [ ] Configurar logs centralizados
- [ ] Implementar alertas
- [ ] Otimizar queries do banco
- [ ] Configurar CDN (se aplicável)
- [ ] Implementar CI/CD
- [ ] Configurar ambiente de staging

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Seguir PEP 8
- Docstrings em todas as funções
- Type hints quando aplicável
- Testes para novas funcionalidades
- Cobertura mínima de 80%
