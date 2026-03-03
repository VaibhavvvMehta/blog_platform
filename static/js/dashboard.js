const token = localStorage.getItem("token");

fetch("/api/posts/", {
    headers: {
        "Authorization": "Token " + token
    }
})
.then(res => res.json())
.then(data => {
    const container = document.getElementById("posts-container");

    if (data.length === 0) {
        container.innerHTML = "<p>No posts available.</p>";
        return;
    }

    data.forEach(post => {
        container.innerHTML += `
            <div class="bg-white p-4 shadow mb-4 rounded">
                <h2 class="text-xl font-bold">${post.title}</h2>
                <p class="text-gray-600">${post.body}</p>
            </div>
        `;
    });
})
.catch(error => {
    console.error("Error:", error);
});