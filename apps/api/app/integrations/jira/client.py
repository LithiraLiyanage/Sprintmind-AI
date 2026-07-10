from __future__ import annotations

from typing import Any

import httpx


class JiraClient:
    def __init__(self, *, cloud_id: str, access_token: str) -> None:
        self.cloud_id = cloud_id
        self.base_url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3"
        self.access_token = access_token

    async def _request(self, method: str, path: str, **kwargs: Any) -> dict[str, Any]:
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {self.access_token}"
        headers["Accept"] = "application/json"
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(method, f"{self.base_url}{path}", headers=headers, **kwargs)
            response.raise_for_status()
            if response.content:
                return response.json()
            return {}

    async def search_issues(self, jql: str, max_results: int = 50) -> dict[str, Any]:
        return await self._request("GET", "/search", params={"jql": jql, "maxResults": max_results})

    async def get_issue(self, issue_key: str) -> dict[str, Any]:
        return await self._request("GET", f"/issue/{issue_key}")

    async def create_issue(self, fields: dict[str, Any]) -> dict[str, Any]:
        return await self._request("POST", "/issue", json={"fields": fields})

    async def update_issue(self, issue_key: str, fields: dict[str, Any]) -> dict[str, Any]:
        return await self._request("PUT", f"/issue/{issue_key}", json={"fields": fields})

    async def add_comment(self, issue_key: str, body: dict[str, Any]) -> dict[str, Any]:
        return await self._request("POST", f"/issue/{issue_key}/comment", json={"body": body})

    async def transition_issue(self, issue_key: str, transition_id: str) -> dict[str, Any]:
        return await self._request("POST", f"/issue/{issue_key}/transitions", json={"transition": {"id": transition_id}})

