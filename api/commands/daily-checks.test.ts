import { generateCalendar } from "./daily-checks";
import type { DailyCheck } from "../../libs/types/supabase";

describe("daily-checks", () => {
  describe("generateCalendar", () => {
    const date = new Date("2024-01-05");
    let dailyChecks: DailyCheck[] = [];
    beforeEach(() => {
      dailyChecks = [
        {
          id: "1",
          challenge_id: "1",
          slack_user_id: "1",
          created_at: "2024-01-02T02:00:00",
          check_type: "checkin",
        },
        {
          id: "2",
          challenge_id: "1",
          slack_user_id: "1",
          created_at: "2024-01-03T02:00:00",
          check_type: "checkin",
        },
        {
          id: "3",
          challenge_id: "1",
          slack_user_id: "1",
          created_at: "2024-01-05T22:00:00",
          check_type: "checkin",
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

    it("should print :palm_tree: on vacation", async () => {
      dailyChecks.push({
        id: "3",
        challenge_id: "1",
        slack_user_id: "1",
        created_at: "2024-01-07T22:00:00",
        check_type: "vacation",
      });
      const calendar = await generateCalendar(date, dailyChecks, 0);
      expect(calendar).toEqual(expect.stringContaining("1월"));
      expect(calendar).toEqual(expect.not.stringContaining("07"));
      expect(calendar).toEqual(expect.stringContaining(":palm_tree:"));
    });

    it("should print '연속 4일'", async () => {
      dailyChecks.push({
        id: "3",
        challenge_id: "1",
        slack_user_id: "1",
        created_at: "2024-01-04T22:00:00",
        check_type: "vacation",
      });
      const calendar = await generateCalendar(
        new Date("2024-01-05"),
        dailyChecks,
        0
      );
      expect(calendar).toEqual(expect.stringContaining("연속 4일"));
    });
  });
});
