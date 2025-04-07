# libraries
import pytest


@pytest.mark.asyncio
async def test_get_oauth_link(client):
    """
    INPUT:
        Call oauth link api
    OUTPUT:
        Get discord link
    """
    response = client.get("/api/auth/oauth-link")
    assert response.status_code == 200
    assert (
        response.json()["discord_link"] == "https://discord.com/api/oauth2/xxxxxxxxxxxxxxxxxxxxxx"
    )


@pytest.mark.asyncio
async def test_get_self_successfully(auth_client):
    """
    INPUT:
        - Valid token
        - Call self api
    OUTPUT:
        Return self information
    """
    response = auth_client.get("/api/auth/self")
    assert response.status_code == 200
    assert response.json() == {
        "id": "111111111111111111111111",
        "discord_id": "111111111111111111",
        "name": "khoitm",
        "email": "dbsiksfikf@gmail.com",
        "avatar_url": "https://cdn.discordapp.com/avatars/111111111111111111/11111111111111111111111111111111.png",
        "roles": ["owner", "admin"],
    }


@pytest.mark.asyncio
async def test_get_self_fail_because_not_logged_in(client):
    """
    INPUT:
        Call self api
    OUTPUT:
        Error not authenticated
    """
    response = client.get("/api/auth/self")
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authenticated"


@pytest.mark.asyncio
async def test_get_self_fail_because_invalid_token(client):
    """
    INPUT:
        - Invalid token
        - Call self api
    OUTPUT:
        Error invalid token
    """
    response = client.get("/api/auth/self", headers={"Authorization": "Bearer aaa"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token"


# @pytest.mark.asyncio
# async def test_get_self_fail_because_token_expired(client):

# @pytest.mark.asyncio
# async def test_get_self_fail_because_do_not_have_enough_permission(client):
