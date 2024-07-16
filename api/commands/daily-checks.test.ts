import { generateCalendar } from "./daily-checks";
import type { DailyCheck } from "../../libs/types/supabase";

describe("generateCalendar", () => {
  const date = new Date("2024-01-01");
  let dailyChecks: DailyCheck[] = [];
  beforeEach(() => {
    dailyChecks = [
      {
        id: "1",
        challenge_id: "1",
        slack_user_id: "1",
        created_at: "2024-01-02T02:00:00",
      },
      {
        id: "2",
        challenge_id: "1",
        slack_user_id: "1",
        created_at: "2024-01-03T02:00:00",
      },
      {
        id: "3",
        challenge_id: "1",
        slack_user_id: "1",
        created_at: "2024-01-05T22:00:00",
      },
    ];
  });

  it("should check 02, 03, 05 when cutoff hour is 0", async () => {
    const cutoffHour = 0;
    const calendar = await generateCalendar(date, dailyChecks, cutoffHour);
    expect(calendar).toEqual(expect.stringContaining("1월"));
    expect(calendar).toEqual(expect.not.stringContaining("02"));
    expect(calendar).toEqual(expect.not.stringContaining("03"));
    expect(calendar).toEqual(expect.not.stringContaining("05"));
    expect(calendar).toEqual(expect.stringContaining("04"));
    expect(calendar).toEqual(expect.stringContaining(":white_check_mark:"));
  });

  it("should check 01, 02, and 05 when cutoff hour is 4", async () => {
    const cutoffHour = 4;
    const calendar = await generateCalendar(date, dailyChecks, cutoffHour);
    expect(calendar).toEqual(expect.stringContaining("1월"));
    expect(calendar).toEqual(expect.not.stringContaining("01"));
    expect(calendar).toEqual(expect.not.stringContaining("02"));
    expect(calendar).toEqual(expect.not.stringContaining("05"));
    expect(calendar).toEqual(expect.stringContaining("03"));
    expect(calendar).toEqual(expect.stringContaining(":white_check_mark:"));
  });

  it("should check 02, 03, and 06 when cutoff hour is -4", async () => {
    const cutoffHour = -4;
    const calendar = await generateCalendar(date, dailyChecks, cutoffHour);
    expect(calendar).toEqual(expect.stringContaining("1월"));
    expect(calendar).toEqual(expect.not.stringContaining("02"));
    expect(calendar).toEqual(expect.not.stringContaining("03"));
    expect(calendar).toEqual(expect.not.stringContaining("06"));
    expect(calendar).toEqual(expect.stringContaining("05"));
    expect(calendar).toEqual(expect.stringContaining(":white_check_mark:"));
  });
});
