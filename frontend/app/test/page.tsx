export default function TestPage() {
    return (
        <main
            style={{
                minHeight: "100vh",
                padding: "40px",
                backgroundColor: "#f8fafc",
                fontFamily: "Arial, sans-serif",
            }}
        >
            <section
                style={{
                    maxWidth: "720px",
                    margin: "0 auto",
                    padding: "32px",
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
                }}
            >
                <h1
                    style={{
                        fontSize: "32px",
                        marginBottom: "16px",
                        color: "#111827",
                    }}
                >
                    MeetMap Test Page
                </h1>

                <p
                    style={{
                        fontSize: "18px",
                        lineHeight: "1.6",
                        color: "#374151",
                    }}
                >
                    프론트 테스트 화면이 정상적으로 뜨고 있습니다.
                </p>

                <div
                    style={{
                        marginTop: "24px",
                        padding: "20px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        backgroundColor: "#f9fafb",
                    }}
                >
                    <strong style={{ color: "#16a34a" }}>
                        Next.js 라우팅 테스트 성공
                    </strong>

                    <p
                        style={{
                            marginTop: "8px",
                            color: "#4b5563",
                        }}
                    >
                        이 페이지가 보이면 <code>/test</code> 경로가 정상적으로 연결된
                        상태입니다.
                    </p>
                </div>
            </section>
        </main>
    );
}